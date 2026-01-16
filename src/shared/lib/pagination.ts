export type PaginationItem = number | "ellipsis";

interface PaginationOptions {
  currentPage: number;
  totalPages: number;
  siblingCount?: number;
  boundaryCount?: number;
}

const range = (start: number, end: number) => {
  if (end < start) return [];
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

export function getPaginationItems({
  currentPage,
  totalPages,
  siblingCount = 1,
  boundaryCount = 1,
}: PaginationOptions): PaginationItem[] {
  if (totalPages <= 0) return [];

  const totalPageNumbers = boundaryCount * 2 + siblingCount * 2 + 3;
  if (totalPages <= totalPageNumbers) {
    return range(1, totalPages);
  }

  const startPages = range(1, Math.min(boundaryCount, totalPages));
  const endPages = range(
    Math.max(totalPages - boundaryCount + 1, boundaryCount + 1),
    totalPages,
  );

  const siblingsStart = Math.max(
    Math.min(
      currentPage - siblingCount,
      totalPages - boundaryCount - siblingCount * 2 - 1,
    ),
    boundaryCount + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(
      currentPage + siblingCount,
      boundaryCount + siblingCount * 2 + 2,
    ),
    endPages.length > 0 ? endPages[0] - 2 : totalPages - 1,
  );

  const items: PaginationItem[] = [];
  items.push(...startPages);

  if (siblingsStart > boundaryCount + 2) {
    items.push("ellipsis");
  } else if (boundaryCount + 1 < totalPages - boundaryCount) {
    items.push(boundaryCount + 1);
  }

  items.push(...range(siblingsStart, siblingsEnd));

  if (siblingsEnd < totalPages - boundaryCount - 1) {
    items.push("ellipsis");
  } else if (totalPages - boundaryCount > boundaryCount) {
    items.push(totalPages - boundaryCount);
  }

  items.push(...endPages);

  return items;
}
