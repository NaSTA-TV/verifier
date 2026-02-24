import { downloaders, getDownloader } from "@repo/lib/downloader";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const submissionsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const submissions = await ctx.db.submission.findMany();

    return submissions;
  }),

  get: protectedProcedure
    .input(z.object({ submissionId: z.cuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.submission.findUnique({
        where: {
          id: input.submissionId,
        },
        include: {
          fileDownload: true,
        },
      });
    }),

  listPossibilities: protectedProcedure
    .input(z.object({ submissionId: z.cuid() }))
    .query(async ({ ctx, input }) => {
      const submission = await ctx.db.submission.findUnique({
        where: {
          id: input.submissionId,
        },
        include: {
          fileDownload: true,
        },
      });

      if (!submission) return [];

      const dl = getDownloader(submission.submittedLink);

      if (!dl) return [];

      const possibilities = dl.listPossibilities(submission.submittedLink);

      return possibilities;
    }),

  // confirmPossibilitie: protectedProcedure
  //   .input(z.object({ submissionId: z.cuid() }))
  //   .query(async ({ ctx, input }) => {
  //     const submission = await ctx.db.submission.findUnique({
  //       where: {
  //         id: input.submissionId,
  //       },
  //     });

  //     if (!submission) return [];

  //     const dl = getDownloader(submission.submittedLink);

  //     if (!dl) return [];

  //     const possibilities = dl.listPossibilities(submission.submittedLink);

  //     return possibilities;
  //   }),

  downloadFile: protectedProcedure
    .input(z.object({ submissionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.db.submission.findUnique({
        where: {
          id: input.submissionId,
        },
        include: {
          fileDownload: true,
        },
      });

      if (
        !submission?.fileDownload?.downloader ||
        !submission.fileDownload.confirmedFile
      )
        return false;

      console.log("file is ready");

      const dl = downloaders[submission.fileDownload.downloader];

      if (!dl) return false;

      console.log("got the downloader");

      const res = await dl.downloadFile(submission.fileDownload.confirmedFile);

      return res.ok;
    }),
});
