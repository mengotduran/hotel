// Stands in for next/cache when server actions run outside a request scope.
module.exports = {
  revalidatePath() {},
  revalidateTag() {},
  updateTag() {},
  refresh() {},
  unstable_cache: (fn) => fn,
};
