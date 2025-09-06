class TenderDetailViewer {
    constructor() {
        this.ocid = this.getOCIDFromURL();
        // Cache DOM queries
        this.domElements = {
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            detailContainer: document.getElementById('tender-detail')
        };
        // Add request caching
        this.detailCache = {};
        this.init();
    }

    init() {
        if (!this.ocid) {
            this.showError('No tender ID provided');
            return;
        }
        this.loadTenderDetail();
    }

    getOCIDFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('ocid');
    }

    async loadTenderDetail() {
        this.domElements.loading.classList.remove('hidden');
        this.domElements.error.classList.add('hidden');
        this.domElements.detailContainer.classList.add('hidden');

        try {
            // Check cache first
            if (this.detailCache[this.ocid]) {
                this.renderTenderDetail(this.detailCache[this.ocid]);
                this.domElements.detailContainer.classList.remove('hidden');
                return;
            }

            const url = `http://localhost:8080/api/OCDSReleases/release/${this.ocid}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Cache the response
            this.detailCache[this.ocid] = data;
            
            this.renderTenderDetail(data);
            this.domElements.detailContainer.classList.remove('hidden');

        } catch (err) {
            console.error('Error loading tender detail:', err);
            this.showError(`Error loading tender details: ${err.message}`);
        } finally {
            this.domElements.loading.classList.add('hidden');
        }
    }

    renderTenderDetail(release) {
        const tender = release.tender || {};
        const tenderPeriod = tender.tenderPeriod || {};
        const procuringEntity = tender.procuringEntity || {};
        const buyer = release.buyer || {};
        const value = tender.value || {};
        const documents = tender.documents || [];

        // Optimize DOM updates by building HTML string first
        let detailHTML = `
            <div class="detail-card">
                <div class="detail-header">
                    <h2 class="detail-title">${this.escapeHtml(tender.title || 'Untitled Tender')}</h2>
                    <div class="detail-meta">
                        <span class="meta-badge">OCID: ${release.ocid}</span>
                        <span class="meta-badge">ID: ${tender.id || 'N/A'}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Description</h3>
                    <p>${this.escapeHtml(tender.description || 'No description available')}</p>
                </div>

                <div class="detail-grid">
                    <div class="detail-section">
                        <h3>Procuring Entity</h3>
                        <p>${procuringEntity.name || buyer.name || 'N/A'}</p>
                        ${procuringEntity.id ? `<p class="detail-sub">ID: ${procuringEntity.id}</p>` : ''}
                    </div>

                    <div class="detail-section">
                        <h3>Procurement Details</h3>
                        <p><strong>Method:</strong> ${tender.procurementMethodDetails || tender.procurementMethod || 'N/A'}</p>
                        <p><strong>Category:</strong> ${tender.mainProcurementCategory || 'N/A'}</p>
                        ${tender.additionalProcurementCategories && tender.additionalProcurementCategories.length > 0 ? 
                            `<p><strong>Additional Categories:</strong> ${tender.additionalProcurementCategories.join(', ')}</p>` : ''}
                    </div>

                    <div class="detail-section">
                        <h3>Tender Period</h3>
                        <p><strong>Start:</strong> ${this.formatDateISO(tenderPeriod.startDate)}</p>
                        <p><strong>End:</strong> ${this.formatDateISO(tenderPeriod.endDate)}</p>
                    </div>

                    <div class="detail-section">
                        <h3>Release Information</h3>
                        <p><strong>Date:</strong> ${this.formatDateISO(release.date)}</p>
                        <p><strong>Language:</strong> ${release.language || 'N/A'}</p>
                        <p><strong>Tags:</strong> ${release.tag ? release.tag.join(', ') : 'N/A'}</p>
                    </div>
                </div>

                ${documents.length > 0 ? this.renderDocuments(documents) : ''}
            </div>
        `;
        
        this.domElements.detailContainer.innerHTML = detailHTML;
    }

    renderDocuments(documents) {
        // Optimize DOM updates by building HTML string first
        let documentsHTML = '';
        documents.forEach(doc => {
            documentsHTML += `
                <div class="document-item">
                    <div class="document-info">
                        <h4>${this.escapeHtml(doc.title || 'Untitled Document')}</h4>
                        ${doc.description ? `<p>${this.escapeHtml(doc.description)}</p>` : ''}
                        <div class="document-meta">
                            <span>Format: ${doc.format || 'N/A'}</span>
                            <span>Published: ${this.formatDateISO(doc.datePublished)}</span>
                            ${doc.dateModified ? `<span>Modified: ${this.formatDateISO(doc.dateModified)}</span>` : ''}
                        </div>
                    </div>
                    ${doc.url ? `<a href="${doc.url}" target="_blank" class="btn-primary">Download</a>` : ''}
                </div>
            `;
        });
        
        return `
            <div class="detail-section">
                <h3>Documents (${documents.length})</h3>
                <div class="documents-list">
                    ${documentsHTML}
                </div>
            </div>
        `;
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

    showError(message) {
        this.domElements.error.textContent = message;
        this.domElements.error.classList.remove('hidden');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TenderDetailViewer();
});