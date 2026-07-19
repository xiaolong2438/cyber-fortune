// AI configuration panel controller.
class AiConfig {
    constructor() {
        this.configManager = new ConfigManager();
        this.apiClient = new ApiClient();
        this.currentConfig = this.configManager.getConfig();
        this.providers = this.configManager.providers;
        this.isLoading = false;
        this.isInitialized = false;
        this.lastFocusedElement = null;
    }

    init() {
        if (this.isInitialized) return;

        this.bindEvents();
        this.loadConfigToUI();
        this.isInitialized = true;
    }

    bindEvents() {
        const configToggle = document.getElementById('config-toggle');
        const configClose = document.getElementById('config-close');
        const configOverlay = document.getElementById('config-overlay');
        const configForm = document.getElementById('global-config-form');
        const testConfigBtn = document.getElementById('test-global-config');
        const loadModelsBtn = document.getElementById('load-models-btn');
        const apiUrlInput = document.getElementById('global-api-url');
        const apiKeyInput = document.getElementById('global-api-key');
        const toggleApiKeyBtn = document.getElementById('toggle-api-key');
        const resetApiUrlBtn = document.getElementById('reset-api-url');
        const resetConfigBtn = document.getElementById('reset-global-config');

        configToggle?.addEventListener('click', () => this.showConfigPanel());
        configClose?.addEventListener('click', () => this.hideConfigPanel());
        configOverlay?.addEventListener('click', () => this.hideConfigPanel());

        configForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.saveConfig();
        });

        testConfigBtn?.addEventListener('click', () => this.testConfig());
        loadModelsBtn?.addEventListener('click', () => this.loadModelsFromAPI());
        toggleApiKeyBtn?.addEventListener('click', () => this.toggleApiKeyVisibility());
        resetApiUrlBtn?.addEventListener('click', () => this.resetApiUrl());
        resetConfigBtn?.addEventListener('click', () => this.resetConfig());

        document.querySelectorAll('.provider-option').forEach((button) => {
            button.addEventListener('click', () => this.selectProvider(button.dataset.provider));
        });

        apiUrlInput?.addEventListener('input', () => this.updateLoadModelsButton());
        apiUrlInput?.addEventListener('change', () => this.detectProvider());
        apiKeyInput?.addEventListener('input', () => this.updateLoadModelsButton());

        document.addEventListener('keydown', (event) => {
            const panel = document.getElementById('global-config-panel');
            if (event.key === 'Escape' && panel?.style.display === 'flex') {
                this.hideConfigPanel();
            }
        });
    }

    showConfigPanel() {
        const panel = document.getElementById('global-config-panel');
        if (!panel) return;

        this.lastFocusedElement = document.activeElement;
        this.loadConfigToUI();
        panel.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.getElementById('global-api-url')?.focus();
    }

    hideConfigPanel() {
        const panel = document.getElementById('global-config-panel');
        if (!panel) return;

        panel.style.display = 'none';
        document.body.style.overflow = '';

        if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
            this.lastFocusedElement.focus();
        }
    }

    loadConfigToUI() {
        const config = this.configManager.getConfig();
        const provider = this.providers[config.provider] ? config.provider : 'custom';
        const baseUrl = config.baseUrl || config.apiUrl || this.providers[provider]?.baseUrl || '';
        const apiUrlInput = document.getElementById('global-api-url');
        const apiKeyInput = document.getElementById('global-api-key');

        this.currentConfig = config;

        if (apiUrlInput) apiUrlInput.value = baseUrl;
        if (apiKeyInput) {
            apiKeyInput.value = config.apiKey || '';
            apiKeyInput.type = 'password';
        }

        this.updateApiKeyToggle(false);
        this.selectProvider(provider, {
            preserveUrl: true,
            selectedModel: config.model,
            clearFeedback: false
        });
        this.clearMessage();
        this.updateStatus();
        this.updateLoadModelsButton();
    }

    selectProvider(provider, options = {}) {
        const selectedProvider = this.providers[provider] ? provider : 'custom';
        const {
            preserveUrl = false,
            selectedModel,
            clearFeedback = true
        } = options;
        const providerSelect = document.getElementById('provider-select');
        const providerDisplay = document.getElementById('provider-display');
        const apiUrlInput = document.getElementById('global-api-url');

        document.querySelectorAll('.provider-option').forEach((button) => {
            const isSelected = button.dataset.provider === selectedProvider;
            button.classList.toggle('is-selected', isSelected);
            button.setAttribute('aria-pressed', String(isSelected));
        });

        if (providerSelect) providerSelect.value = selectedProvider;
        if (providerDisplay) {
            providerDisplay.textContent = this.providers[selectedProvider]?.name || '自定义';
        }

        if (apiUrlInput && !preserveUrl) {
            apiUrlInput.value = this.providers[selectedProvider]?.baseUrl || '';
        }

        this.renderModelOptions([], selectedModel);
        this.updateLoadModelsButton();
        this.updateStatus('idle');
        if (clearFeedback) this.clearMessage();
    }

    renderModelOptions(models = [], selectedModel = undefined) {
        const modelInput = document.getElementById('global-model');
        const datalist = document.getElementById('global-model-options');
        if (!modelInput || !datalist) return;

        datalist.innerHTML = '';
        (Array.isArray(models) ? models : []).forEach((model) => {
            const option = document.createElement('option');
            option.value = model.id;
            option.label = model.name || model.id;
            datalist.appendChild(option);
        });

        if (selectedModel !== undefined && selectedModel !== null) {
            modelInput.value = selectedModel;
        }
    }

    async loadModelsFromAPI(showLoading = true) {
        if (this.isLoading) return;

        const baseUrl = document.getElementById('global-api-url')?.value.trim();
        const apiKey = document.getElementById('global-api-key')?.value.trim();
        const provider = this.getSelectedProvider(baseUrl);
        const modelInput = document.getElementById('global-model');
        const loadModelsBtn = document.getElementById('load-models-btn');

        if (!baseUrl || !apiKey) {
            this.showMessage('请先填写 API 地址和密钥。', 'error');
            return;
        }

        if (!modelInput) return;

        try {
            this.isLoading = true;
            this.updateLoadModelsButton();

            if (showLoading) {
                this.showMessage('正在从服务商加载模型列表...', 'info');
                this.setButtonLabel(loadModelsBtn, '加载中...');
            }

            const modelsUrl = this.configManager.getModelsUrl(provider, baseUrl);
            const models = await this.apiClient.getAvailableModels(modelsUrl, apiKey, provider);

            if (!models || models.length === 0) {
                this.renderModelOptions([]);
                this.showMessage('接口未返回模型列表，请手动输入模型 ID。', 'warning');
                return;
            }

            const previousModel = modelInput.value || this.currentConfig.model || '';
            this.renderModelOptions(models, previousModel);

            this.showMessage(`已加载 ${models.length} 个模型。`, 'success');
        } catch (error) {
            console.error('加载模型失败:', error);
            this.renderModelOptions([]);
            const localHint = this.apiClient.isLocalDevelopment
                ? ' 本地静态预览可能被服务商 CORS 拦截；请用 Cloudflare Pages 预览做完整联调。'
                : '';
            this.showMessage(`加载模型失败：${error.message}；仍可手动输入模型 ID。${localHint}`, 'error');
        } finally {
            this.isLoading = false;
            this.setButtonLabel(loadModelsBtn, '加载模型');
            this.updateLoadModelsButton();
        }
    }

    detectProvider() {
        const apiUrl = document.getElementById('global-api-url')?.value.trim();
        if (!apiUrl) {
            this.selectProvider('custom', { preserveUrl: true });
            return;
        }

        const provider = this.configManager.detectProviderFromUrl(apiUrl) || 'custom';
        this.selectProvider(provider, { preserveUrl: true });
    }

    getSelectedProvider(baseUrl = '') {
        const selected = document.getElementById('provider-select')?.value;
        if (selected && this.providers[selected]) return selected;
        return this.configManager.detectProviderFromUrl(baseUrl) || 'custom';
    }

    resetApiUrl() {
        const provider = this.getSelectedProvider();
        const apiUrlInput = document.getElementById('global-api-url');
        if (!apiUrlInput) return;

        apiUrlInput.value = this.providers[provider]?.baseUrl || '';
        apiUrlInput.focus();
        this.updateLoadModelsButton();
        this.clearMessage();
    }

    toggleApiKeyVisibility() {
        const apiKeyInput = document.getElementById('global-api-key');
        if (!apiKeyInput) return;

        const isVisible = apiKeyInput.type === 'text';
        apiKeyInput.type = isVisible ? 'password' : 'text';
        this.updateApiKeyToggle(!isVisible);
        apiKeyInput.focus();
    }

    updateApiKeyToggle(isVisible) {
        const toggleButton = document.getElementById('toggle-api-key');
        if (!toggleButton) return;

        const label = isVisible ? '隐藏密钥' : '显示密钥';
        toggleButton.setAttribute?.('aria-label', label);
        toggleButton.title = label;
        toggleButton.setAttribute?.('aria-pressed', String(isVisible));
    }

    resetConfig() {
        localStorage.removeItem(this.configManager.configKey);
        this.configManager.clearModelsCache();
        this.currentConfig = this.configManager.getConfig();
        this.loadConfigToUI();
        this.showMessage('已恢复默认设置，API 密钥已清除。', 'success');
    }

    updateLoadModelsButton() {
        const baseUrl = document.getElementById('global-api-url')?.value.trim();
        const apiKey = document.getElementById('global-api-key')?.value.trim();
        const loadModelsBtn = document.getElementById('load-models-btn');

        if (loadModelsBtn) {
            loadModelsBtn.disabled = !baseUrl || !apiKey || this.isLoading;
        }
    }

    async saveConfig() {
        const baseUrlInput = document.getElementById('global-api-url')?.value.trim();
        const apiKey = document.getElementById('global-api-key')?.value.trim();
        const model = document.getElementById('global-model')?.value;
        const provider = this.getSelectedProvider(baseUrlInput);

        if (!baseUrlInput || !apiKey || !model) {
            this.showMessage('请填写 API 地址、密钥并选择模型。', 'error');
            return;
        }

        const baseUrl = this.configManager.normalizeApiBaseUrl(baseUrlInput);
        const config = {
            baseUrl,
            apiUrl: this.configManager.getApiUrl(provider, baseUrl),
            apiKey,
            model,
            provider,
            savedAt: new Date().toISOString()
        };

        try {
            if (!this.configManager.saveConfig(config)) {
                throw new Error('浏览器存储不可用');
            }

            this.currentConfig = config;
            const apiUrlInput = document.getElementById('global-api-url');
            if (apiUrlInput) apiUrlInput.value = baseUrl;
            this.updateStatus('configured');
            this.showMessage('配置已保存，所有 AI 功能将共用此设置。', 'success');
        } catch (error) {
            console.error('保存配置失败:', error);
            this.showMessage(`保存配置失败：${error.message}`, 'error');
        }
    }

    async testConfig() {
        const baseUrl = document.getElementById('global-api-url')?.value.trim();
        const apiKey = document.getElementById('global-api-key')?.value.trim();
        const model = document.getElementById('global-model')?.value;
        const provider = this.getSelectedProvider(baseUrl);
        const testButton = document.getElementById('test-global-config');

        if (!baseUrl || !apiKey || !model) {
            this.showMessage('请填写 API 地址、密钥并选择模型后再测试。', 'error');
            return;
        }

        try {
            testButton.disabled = true;
            this.setButtonLabel(testButton, '测试中...');
            this.updateStatus('testing');
            this.showMessage('正在验证地址、密钥和模型接口...', 'info');

            const apiUrl = this.configManager.getApiUrl(provider, baseUrl);
            const response = await this.apiClient.requestAIResponse(apiUrl, apiKey, {
                model,
                messages: [{ role: 'user', content: '请仅回复 OK' }],
                stream: false,
                max_tokens: 3,
                temperature: 0
            });
            if (!response.ok) {
                let detail = `HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    detail = errorData.error?.message || errorData.message || detail;
                } catch (error) {
                    // Keep the HTTP status when the provider returns non-JSON.
                }
                throw new Error(detail);
            }

            this.updateStatus('connected');
            this.showMessage('连接成功，可以保存并开始使用。', 'success');
        } catch (error) {
            console.error('测试配置失败:', error);
            this.updateStatus('error');
            this.showMessage(`连接失败：${error.message}`, 'error');
        } finally {
            if (testButton) testButton.disabled = false;
            this.setButtonLabel(testButton, '测试连接');
        }
    }

    updateStatus(status = null) {
        const statusElement = document.getElementById('config-status');
        const statusText = statusElement?.querySelector('.status-text');
        const statusDetail = statusElement?.querySelector('.status-detail');
        if (!statusElement || !statusText || !statusDetail) return;

        const configured = (this.currentConfig.baseUrl || this.currentConfig.apiUrl) &&
            this.currentConfig.apiKey && this.currentConfig.model;
        const nextStatus = status || (configured ? 'configured' : 'idle');
        const copy = {
            idle: ['未连接', '尚未进行连接测试'],
            configured: ['已配置', '建议测试连接后使用'],
            testing: ['测试中', '正在请求模型接口'],
            connected: ['连接成功', '地址与密钥均可用'],
            error: ['连接失败', '请检查提示信息后重试']
        };

        const [text, detail] = copy[nextStatus] || copy.idle;
        statusElement.dataset.status = nextStatus;
        statusText.textContent = text;
        statusDetail.textContent = detail;
    }

    setButtonLabel(button, label) {
        const labelElement = button?.querySelector('.button-label');
        if (labelElement) labelElement.textContent = label;
    }

    showMessage(message, type = 'info') {
        const feedback = document.getElementById('config-feedback');
        if (!feedback) return;

        feedback.dataset.type = type;
        feedback.textContent = message;
        feedback.hidden = false;
    }

    clearMessage() {
        const feedback = document.getElementById('config-feedback');
        if (!feedback) return;

        feedback.hidden = true;
        feedback.textContent = '';
        delete feedback.dataset.type;
    }

    getCurrentConfig() {
        return this.currentConfig;
    }

    isConfigValid() {
        return !!((this.currentConfig.baseUrl || this.currentConfig.apiUrl) &&
            this.currentConfig.apiKey && this.currentConfig.model);
    }
}

window.AiConfig = AiConfig;
