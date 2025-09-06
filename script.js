class OCDSViewer {
    constructor() {
        this.currentPage = 1;
        this.totalReleases = 0;
        this.releases = [];
        // Cache DOM queries
        this.domElements = {
            loadData: document.getElementById('loadData'),
            prevPage: document.getElementById('prevPage'),
            nextPage: document.getElementById('nextPage'),
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            releases: document.getElementById('releases'),
            searchInput: document.getElementById('searchInput'),
            dateFrom: document.getElementById('dateFrom'),
            dateTo: document.getElementById('dateTo'),
            pageSize: document.getElementById('pageSize'),
            totalCount: document.getElementById('totalCount'),
            currentPage: document.getElementById('currentPage')
        };
        // Add request caching
        this.searchCache = {};
        // Add search debouncing
        this.searchTimeout = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadReleases();
    }

    bindEvents() {
        this.domElements.loadData.addEventListener('click', () => {
            this.currentPage = 1;
            this.loadReleases();
        });

        this.domElements.prevPage.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadReleases();
            }
        });

        this.domElements.nextPage.addEventListener('click', () => {
            this.currentPage++;
            this.loadReleases();
        });
        
        // Add search debouncing
        this.domElements.searchInput.addEventListener('input', () => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentPage = 1;
                this.loadReleases();
            }, 300); // 300ms delay
        });
    }

    async loadReleases() {
        // Show loading state
        this.domElements.loading.classList.remove('hidden');
        this.domElements.error.classList.add('hidden');
        this.domElements.releases.innerHTML = '';

        try {
            const params = this.getQueryParams();
            const cacheKey = params;
            
            // Check cache first
            if (this.searchCache[cacheKey]) {
                const cachedData = this.searchCache[cacheKey];
                this.releases = cachedData.releases || [];
                this.totalReleases = this.releases.length;
                this.renderReleases();
                this.updateStats();
                this.updatePagination();
                return;
            }

            const url = `http://localhost:8080/api/OCDSReleases?${params}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.releases = data.releases || [];
            this.totalReleases = this.releases.length;

            // Cache the response
            this.searchCache[cacheKey] = data;

            this.renderReleases();
            this.updateStats();
            this.updatePagination();

        } catch (err) {
            console.error('Error loading releases:', err);
            this.domElements.error.textContent = `Error loading data: ${err.message}`;
            this.domElements.error.classList.remove('hidden');
        } finally {
            this.domElements.loading.classList.add('hidden');
        }
    }

    getQueryParams() {
        const search = this.domElements.searchInput.value;
        const dateFrom = this.domElements.dateFrom.value;
        const dateTo = this.domElements.dateTo.value;
        const pageSize = this.domElements.pageSize.value;

        const params = {
            PageNumber: this.currentPage,
            PageSize: pageSize
        };
        
        if (search) params.search = search;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        return new URLSearchParams(params).toString();
    }

    renderReleases() {
        if (this.releases.length === 0) {
            this.domElements.releases.innerHTML = '<div class="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg">No releases found for the selected criteria.</div>';
            return;
        }

        // Optimize DOM updates by building HTML string first
        let releasesHTML = '';
        this.releases.forEach(release => {
            releasesHTML += this.createReleaseCard(release);
        });
        this.domElements.releases.innerHTML = releasesHTML;
    }

    createReleaseCard(release) {
        const tender = release.tender || {};
        const tenderPeriod = tender.tenderPeriod || {};
        const procuringEntity = tender.procuringEntity || {};
        const buyer = release.buyer || {};

        return `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700" onclick="window.location.href='detail.html?ocid=${encodeURIComponent(release.ocid)}'">
                ${tender.description ? `<div class="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">${this.escapeHtml(tender.description)}</div>` : ''}
                
                <div class="space-y-3">
                    <div class="font-medium text-gray-900 dark:text-white">
                        ${procuringEntity.name || buyer.name || 'N/A'}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        ${tender.procurementMethodDetails || tender.procurementMethod || 'N/A'}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-500">
                        ${this.formatDateISO(tenderPeriod.startDate)} - ${this.formatDateISO(tenderPeriod.endDate)}
                    </div>
                </div>
            </div>
        `;
    }

    getStatusClass(status) {
        if (!status) return '';
        
        const statusLower = status.toLowerCase();
        if (statusLower.includes('active') || statusLower.includes('open')) {
            return 'status-active';
        } else if (statusLower.includes('complete') || statusLower.includes('closed')) {
            return 'status-complete';
        } else if (statusLower.includes('cancel')) {
            return 'status-cancelled';
        }
        return '';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    formatDateRange(startDate, endDate) {
        const start = this.formatDate(startDate);
        const end = this.formatDate(endDate);
        
        if (start === 'N/A' && end === 'N/A') return 'N/A';
        if (start === 'N/A') return `Until ${end}`;
        if (end === 'N/A') return `From ${start}`;
        
        return `${start} - ${end}`;
    }

    formatDateISO(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return dateString;
        }
    }

    formatCurrency(amount, currency) {
        if (!amount && amount !== 0) return 'N/A';
        
        const currencyCode = currency || 'ZAR';
        try {
            return new Intl.NumberFormat('en-ZA', {
                style: 'currency',
                currency: currencyCode
            }).format(amount);
        } catch {
            return `${currencyCode} ${amount.toLocaleString()}`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateStats() {
        document.getElementById('totalCount').textContent = `Total: ${this.totalReleases}`;
        document.getElementById('currentPage').textContent = `Page: ${this.currentPage}`;
    }

    updatePagination() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageSize = parseInt(document.getElementById('pageSize').value);

        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.releases.length < pageSize;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new OCDSViewer();
});