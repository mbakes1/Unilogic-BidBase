class OCDSViewer {
    constructor() {
        this.currentPage = 1;
        this.totalReleases = 0;
        this.releases = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadReleases();
    }

    bindEvents() {
        document.getElementById('loadData').addEventListener('click', () => {
            this.currentPage = 1;
            this.loadReleases();
        });

        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadReleases();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            this.currentPage++;
            this.loadReleases();
        });
    }

    async loadReleases() {
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const releasesContainer = document.getElementById('releases');

        // Show loading state
        loading.classList.remove('hidden');
        error.classList.add('hidden');
        releasesContainer.innerHTML = '';

        try {
            const params = this.getQueryParams();
            const url = `http://localhost:8080/api/OCDSReleases?${params}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.releases = data.releases || [];
            this.totalReleases = this.releases.length;

            this.renderReleases();
            this.updateStats();
            this.updatePagination();

        } catch (err) {
            console.error('Error loading releases:', err);
            error.textContent = `Error loading data: ${err.message}`;
            error.classList.remove('hidden');
        } finally {
            loading.classList.add('hidden');
        }
    }

    getQueryParams() {
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        const pageSize = document.getElementById('pageSize').value;

        return new URLSearchParams({
            PageNumber: this.currentPage,
            PageSize: pageSize,
            dateFrom: dateFrom,
            dateTo: dateTo
        }).toString();
    }

    renderReleases() {
        const container = document.getElementById('releases');
        
        if (this.releases.length === 0) {
            container.innerHTML = '<div class="no-results">No releases found for the selected criteria.</div>';
            return;
        }

        container.innerHTML = this.releases.map(release => this.createReleaseCard(release)).join('');
    }

    createReleaseCard(release) {
        const tender = release.tender || {};
        const tenderPeriod = tender.tenderPeriod || {};
        const procuringEntity = tender.procuringEntity || {};
        const buyer = release.buyer || {};

        return `
            <div class="release-card" onclick="window.location.href='detail.html?ocid=${encodeURIComponent(release.ocid)}'">
                ${tender.description ? `<div class="release-description">${this.escapeHtml(tender.description)}</div>` : ''}
                
                <div class="release-info">
                    <div class="info-item">
                        ${procuringEntity.name || buyer.name || 'N/A'}
                    </div>
                    <div class="info-item">
                        ${tender.procurementMethodDetails || tender.procurementMethod || 'N/A'}
                    </div>
                    <div class="info-item">
                        ${this.formatDateISO(tenderPeriod.startDate)}<br>
                        ${this.formatDateISO(tenderPeriod.endDate)}
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