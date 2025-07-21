export class Paginator {
    array: any[] = [];
    currentPage: number = 1;
    pageSize: number = 5;

    constructor(array: any[], pageSize: number) {
        this.array = array;
        this.pageSize = pageSize;
    }

    get filteredData(): any[] {
        return this.array.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
    }

    get totalPages(): number {
        return Math.ceil(
            this.array.length / this.pageSize
        );
    }

    get prevPageColor() {
        return this.currentPage === 1 ? 'var(--theme-color-neutral-2)' : 'white';
    }

    get nextPageColor() {
        return this.currentPage === this.totalPages ? 'var(--theme-color-neutral-2)' : 'white';
    }

    changePage(delta: number) {
        const newPage = this.currentPage + delta;
        if (newPage > 0 && newPage <= this.totalPages) {
            this.currentPage = newPage;
        }
    }

    firstPage() {
        this.currentPage = 1;
    }

    lastPage() {
        this.currentPage = this.totalPages;
    }
}