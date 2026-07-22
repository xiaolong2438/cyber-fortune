// 赛博论命 - 主交互脚本

class CyberFortune {
    constructor() {
        this.currentSection = 'home';
        this.baziCalculator = new BaziCalculator();
        this.nameCalculator = new NameCalculator();
        this.marriageCalculator = new MarriageCalculator();
        this.formAssistant = window.FormAssistant ? new window.FormAssistant() : null;
        this.namingAnalysisTimer = null;
        this.namingAnalysisGeneration = 0;
        this.namingAnalysisAbortController = null;

        // 初始化紫薇斗数计算器
        try {
            this.ziweiCalculator = new ZiweiCalculator();
        } catch (error) {
            console.error('紫薇斗数计算器初始化失败:', error);
            this.ziweiCalculator = null;
        }
        try {
            this.ziweiInterpreter = window.ZiweiInterpreter ? new window.ZiweiInterpreter() : null;
        } catch (error) {
            console.error('紫微斗数白话解释器初始化失败:', error);
            this.ziweiInterpreter = null;
        }

        this.init();
    }

    init() {
        console.log('Initializing CyberFortune...');
        this.setupNavigation();
        this.setupForms();
        this.formAssistant?.init();

        // 延迟填充选择框，确保DOM完全加载
        setTimeout(() => {
            this.populateSelects();
        }, 100);

        this.setupEventListeners();
        this.initGlobalConfig();

        // 再次检查并填充选择框（防止第一次失败）
        setTimeout(() => {
            this.ensureSelectsPopulated();
        }, 500);
    }

    // 设置导航
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.section');
        const featureCards = document.querySelectorAll('.feature-card');
        const navToggle = document.getElementById('nav-toggle');

        navToggle?.addEventListener('click', () => {
            const expanded = navToggle.getAttribute('aria-expanded') === 'true';
            this.setMobileNavigation(!expanded);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') {
                this.setMobileNavigation(false);
                navToggle.focus();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) this.setMobileNavigation(false);
        });

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = item.getAttribute('data-section');
                this.switchSection(targetSection);
                this.setMobileNavigation(false);
                this.focusSectionHeading(targetSection);
            });
        });

        featureCards.forEach(card => {
            card.addEventListener('click', () => {
                const targetSection = card.getAttribute('data-target');
                if (targetSection) {
                    this.switchSection(targetSection);
                    this.focusSectionHeading(targetSection);
                }
            });
        });
    }

    setMobileNavigation(open) {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (!navToggle || !navMenu) return;
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? '收起功能导航' : '展开功能导航');
        navMenu.classList.toggle('is-open', open);
    }

    focusSectionHeading(sectionId) {
        const heading = document.querySelector(`#${sectionId} .section-title, #${sectionId} h1`);
        if (!heading) return;
        heading.setAttribute('tabindex', '-1');
        requestAnimationFrame(() => heading.focus());
    }

    // 切换页面
    switchSection(targetSection) {
        const sections = document.querySelectorAll('.section');
        const navItems = document.querySelectorAll('.nav-item');

        // 隐藏所有页面
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // 移除所有导航项的激活状态
        navItems.forEach(item => {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
        });

        // 显示目标页面
        const targetElement = document.getElementById(targetSection);
        if (targetElement) {
            targetElement.classList.add('active');
            targetElement.classList.add('section-enter');

            setTimeout(() => {
                targetElement.classList.remove('section-enter');
            }, 500);
        }

        // 激活对应的导航项
        const targetNavItem = document.querySelector(`[data-section="${targetSection}"]`);
        if (targetNavItem) {
            targetNavItem.classList.add('active');
            targetNavItem.setAttribute('aria-current', 'page');
        }

        this.currentSection = targetSection;
    }

    // 设置表单
    setupForms() {
        // 赛博知命表单
        const zhimingForm = document.getElementById('zhiming-form');
        if (zhimingForm) {
            zhimingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleZhimingSubmit(e);
            });
        }

        // 赛博起名表单
        const qimingForm = document.getElementById('qiming-form');
        if (qimingForm) {
            qimingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleQimingSubmit(e);
            });
        }

        // 赛博测名表单
        const cemingForm = document.getElementById('ceming-form');
        if (cemingForm) {
            cemingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCemingSubmit(e);
            });
        }

        // 赛博合婚表单
        const hehunForm = document.getElementById('hehun-form');
        if (hehunForm) {
            hehunForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleHehunSubmit(e);
            });
        }
    }

    // 填充选择框
    populateSelects() {
        console.log('Starting to populate selects...');
        this.populateYears();
        this.populateMonths();
        this.populateDays();
        this.populateProvinces();
        console.log('Finished populating selects');
    }

    // 确保选择框已填充（重试机制）
    ensureSelectsPopulated() {
        console.log('Checking if selects are properly populated...');

        // 检查年份选择框
        const yearSelects = document.querySelectorAll('select[name="birthYear"], select[name="maleBirthYear"], select[name="femaleBirthYear"]');
        let needsRepopulation = false;

        yearSelects.forEach(select => {
            if (select.children.length <= 1) { // 只有默认选项
                console.log(`Year select ${select.name} is empty, needs repopulation`);
                needsRepopulation = true;
            }
        });

        // 检查月份选择框
        const monthSelects = document.querySelectorAll('select[name="birthMonth"], select[name="maleBirthMonth"], select[name="femaleBirthMonth"]');
        monthSelects.forEach(select => {
            if (select.children.length <= 1) { // 只有默认选项
                console.log(`Month select ${select.name} is empty, needs repopulation`);
                needsRepopulation = true;
            }
        });

        if (needsRepopulation) {
            console.log('Repopulating selects...');
            this.populateSelects();
        } else {
            console.log('All selects are properly populated');
        }
    }

    // 填充年份选择框
    populateYears() {
        const yearSelects = document.querySelectorAll('select[name="birthYear"], select[name="maleBirthYear"], select[name="femaleBirthYear"]');
        const currentYear = new Date().getFullYear();

        console.log('Populating years, found selects:', yearSelects.length);

        yearSelects.forEach((select, index) => {
            console.log(`Populating year select ${index}:`, select.name);
            // 清空现有选项（保留第一个默认选项）
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }

            for (let year = currentYear; year >= 1900; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year + '年';
                select.appendChild(option);
            }
            console.log(`Year select ${select.name} populated with ${select.children.length - 1} options`);
        });
    }

    // 填充月份选择框
    populateMonths() {
        const monthSelects = document.querySelectorAll('select[name="birthMonth"], select[name="maleBirthMonth"], select[name="femaleBirthMonth"]');

        console.log('Populating months, found selects:', monthSelects.length);

        monthSelects.forEach((select, index) => {
            console.log(`Populating month select ${index}:`, select.name);
            // 清空现有选项（保留第一个默认选项）
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }

            for (let month = 1; month <= 12; month++) {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = month + '月';
                select.appendChild(option);
            }
            console.log(`Month select ${select.name} populated with ${select.children.length - 1} options`);
        });
    }

    // 填充日期选择框
    populateDays() {
        const daySelects = document.querySelectorAll('select[name="birthDay"], select[name="maleBirthDay"], select[name="femaleBirthDay"]');

        daySelects.forEach(select => {
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            for (let day = 1; day <= 31; day++) {
                const option = document.createElement('option');
                option.value = day;
                option.textContent = day + '日';
                select.appendChild(option);
            }
        });
    }

    // 填充省份选择框
    populateProvinces() {
        const provinces = [
            '北京市', '天津市', '上海市', '重庆市',
            '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
            '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
            '河南省', '湖北省', '湖南省', '广东省', '海南省',
            '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省',
            '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
            '香港特别行政区', '澳门特别行政区', '台湾省'
        ];

        const provinceSelects = document.querySelectorAll('select[name="birthProvince"], select[name="maleBirthProvince"], select[name="femaleBirthProvince"]');

        provinceSelects.forEach(select => {
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            provinces.forEach(province => {
                const option = document.createElement('option');
                option.value = province;
                option.textContent = province;
                select.appendChild(option);
            });
        });
    }

    // 设置事件监听器
    setupEventListeners() {
        // 省份变化时更新城市
        const provinceSelects = document.querySelectorAll('select[name="birthProvince"], select[name="maleBirthProvince"], select[name="femaleBirthProvince"]');
        provinceSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.updateCities(e.target.value, e.target.closest('form'), e.target);
            });
        });

        // 月份变化时更新日期
        const monthSelects = document.querySelectorAll('select[name="birthMonth"], select[name="maleBirthMonth"], select[name="femaleBirthMonth"]');
        monthSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.updateDaysForTarget(e.target);
            });
        });

        // 年份变化时更新日期
        const yearSelects = document.querySelectorAll('select[name="birthYear"], select[name="maleBirthYear"], select[name="femaleBirthYear"]');
        yearSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.updateDaysForTarget(e.target);
            });
        });
    }

    // 更新城市选择框
    updateCities(province, form, sourceSelect = null) {
        // 查找对应的城市选择框
        let citySelect = form.querySelector('select[name="birthCity"]');

        // 如果没找到，可能是合婚表单中的男方或女方城市选择框
        if (!citySelect) {
            const provinceSelect = sourceSelect || form.querySelector('select:focus');

            if (provinceSelect) {
                const provinceName = provinceSelect.name;
                if (provinceName === 'maleBirthProvince') {
                    citySelect = form.querySelector('select[name="maleBirthCity"]');
                } else if (provinceName === 'femaleBirthProvince') {
                    citySelect = form.querySelector('select[name="femaleBirthCity"]');
                }
            }
        }

        if (!citySelect) return;

        // 清空现有选项
        citySelect.innerHTML = '<option value="">选择城市</option>';

        // 从八字计算器获取城市数据
        const cities = this.getCitiesForProvince(province);

        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }

    // 获取指定省份的城市列表
    getCitiesForProvince(province) {
        // 使用八字计算器的经度数据库
        if (!this.baziCalculator || !this.baziCalculator.locationData) {
            return ['市区']; // 备用选项
        }

        const locationData = this.baziCalculator.locationData;

        if (locationData[province]) {
            return Object.keys(locationData[province]);
        }

        return ['市区']; // 备用选项
    }

    // 根据触发的目标元素更新对应的日期选择框
    updateDaysForTarget(targetElement) {
        const form = targetElement.closest('form');
        if (!form) return;

        const targetName = targetElement.name;
        let prefix = '';

        // 根据触发元素的name确定前缀
        if (targetName.includes('male')) {
            prefix = 'male';
        } else if (targetName.includes('female')) {
            prefix = 'female';
        } else {
            prefix = ''; // 通用字段（如知命模块）
        }

        // 构建对应的字段名
        const yearName = prefix ? `${prefix}BirthYear` : 'birthYear';
        const monthName = prefix ? `${prefix}BirthMonth` : 'birthMonth';
        const dayName = prefix ? `${prefix}BirthDay` : 'birthDay';

        // 查找对应的选择框
        const yearSelect = form.querySelector(`select[name="${yearName}"]`);
        const monthSelect = form.querySelector(`select[name="${monthName}"]`);
        const daySelect = form.querySelector(`select[name="${dayName}"]`);

        if (!yearSelect || !monthSelect || !daySelect) return;

        const year = parseInt(yearSelect.value);
        const month = parseInt(monthSelect.value);

        if (!year || !month) return;

        // 保存当前选中的日期
        const currentDay = daySelect.value;

        // 清空现有选项
        daySelect.innerHTML = '<option value="">选择日期</option>';

        // 计算该月的天数
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day + '日';
            daySelect.appendChild(option);
        }

        // 如果之前选择的日期在新月份中仍然有效，则保持选中
        if (currentDay && parseInt(currentDay) <= daysInMonth) {
            daySelect.value = currentDay;
        }
    }

    // 更新日期选择框（保留原函数以兼容其他调用）
    updateDays(form) {
        // 尝试不同的字段名模式
        const yearSelectors = ['select[name="birthYear"]', 'select[name="maleBirthYear"]', 'select[name="femaleBirthYear"]'];
        const monthSelectors = ['select[name="birthMonth"]', 'select[name="maleBirthMonth"]', 'select[name="femaleBirthMonth"]'];
        const daySelectors = ['select[name="birthDay"]', 'select[name="maleBirthDay"]', 'select[name="femaleBirthDay"]'];

        let yearSelect, monthSelect, daySelect;

        // 查找对应的选择框
        for (let i = 0; i < yearSelectors.length; i++) {
            const year = form.querySelector(yearSelectors[i]);
            const month = form.querySelector(monthSelectors[i]);
            const day = form.querySelector(daySelectors[i]);

            if (year && month && day) {
                yearSelect = year;
                monthSelect = month;
                daySelect = day;
                break;
            }
        }

        if (!yearSelect || !monthSelect || !daySelect) return;

        const year = parseInt(yearSelect.value);
        const month = parseInt(monthSelect.value);

        if (!year || !month) return;

        // 清空现有选项
        daySelect.innerHTML = '<option value="">选择日期</option>';

        // 计算该月的天数
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day + '日';
            daySelect.appendChild(option);
        }
    }

    // 处理赛博知命表单提交
    async handleZhimingSubmit(e) {
        const form = e.target;
        if (this.formAssistant && !this.formAssistant.validate(form)) return;
        const formData = new FormData(form);
        
        const birthData = {
            gender: formData.get('gender'),
            year: parseInt(formData.get('birthYear')),
            month: parseInt(formData.get('birthMonth')),
            day: parseInt(formData.get('birthDay')),
            hour: parseInt(formData.get('birthHour')),
            minute: parseInt(formData.get('birthMinute')) || 0,
            birthProvince: formData.get('birthProvince'),
            birthCity: formData.get('birthCity')
        };

        // 验证数据
        if (!this.validateBirthData(birthData)) {
            this.showError('请填写完整的出生信息');
            return;
        }

        window.FormAssistant?.saveRecent(birthData);

        // 显示加载动画
        this.showLoading();

        try {
            // 计算八字
            const baziResult = this.baziCalculator.calculate(birthData);

            // 计算紫薇斗数（如果可用）
            let ziweiResult = null;
            if (this.ziweiCalculator) {
                try {
                    ziweiResult = this.ziweiCalculator.calculate(birthData);
                } catch (ziweiError) {
                    console.error('紫薇斗数计算错误:', ziweiError);
                }
            }

            // 生成AI分析提示词
            const prompt = this.baziCalculator.generatePrompt(birthData, baziResult);

            // 显示结果
            this.displayZhimingResult(birthData, baziResult, prompt, ziweiResult);

        } catch (error) {
            console.error('计算错误:', error);
            this.showError('计算过程中出现错误，请重试');
        } finally {
            this.hideLoading();
        }
    }

    // 验证出生数据
    validateBirthData(data) {
        return data.gender && data.year && data.month && data.day &&
               data.hour !== null && data.minute !== null && data.birthProvince && data.birthCity;
    }

    // 显示加载动画
    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'flex';
        }
    }

    // 隐藏加载动画
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    // 显示错误信息
    showError(message) {
        alert(message); // 简化版，实际应该用更好的UI组件
    }

    // 显示赛博知命结果
    displayZhimingResult(birthData, baziResult, prompt, ziweiResult = null) {
        const resultPanel = document.getElementById('zhiming-result');
        if (!resultPanel) return;
        const resultContent = resultPanel.querySelector('.result-content');
        if (!resultContent) return;

        const previousChart = resultContent.querySelector('#ziwei-chart-root');
        if (previousChart) window.ZiweiChart?.unmount?.(previousChart);

        // 构建结果HTML
        const resultHTML = this.buildZhimingResultHTML(birthData, baziResult, prompt, ziweiResult);
        resultContent.innerHTML = resultHTML;
        this.mountZiweiChart(birthData, ziweiResult);

        // 显示结果面板
        resultPanel.style.display = 'block';
        resultPanel.classList.add('show');
        resultPanel.closest('.content-container')?.classList.add('has-result');

        // 绑定AI分析按钮事件
        this.bindAIAnalysisEvents(birthData, baziResult, prompt, ziweiResult);

        // 滚动到结果区域
        resultPanel.scrollIntoView({ behavior: 'smooth' });

        // 自动开始AI分析
        setTimeout(() => {
            console.log('自动开始知命AI分析...');
            this.generateAIAnalysis(birthData, baziResult, prompt, ziweiResult);
        }, 1000); // 延迟1秒，确保界面渲染完成
    }

    // 构建赛博知命结果HTML
    buildZhimingResultHTML(birthData, baziResult, prompt, ziweiResult = null) {
        const { gender, year, month, day, hour, minute, birthProvince, birthCity } = birthData;
        const { yearPillar, monthPillar, dayPillar, hourPillar, yearTenGod, monthTenGod, hourTenGod, bigLuck, wuxingInfo, naYinInfo } = baziResult;

        return `
            <div class="result-header">
                <h3 class="result-title">命理分析报告</h3>
                <div class="result-info">
                    <span>${gender} | ${year}年${month}月${day}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} | ${birthProvince} ${birthCity}</span>
                    ${baziResult.calculationMethod === 'backup' ?
                        '<div class="calculation-method-warning">⚠️ 当前使用简化计算方法，建议加载lunisolar库以获得更精确的结果</div>' :
                        '<div class="calculation-method-info">✅ 使用lunisolar库精确计算</div>'
                    }
                </div>
            </div>

            <div class="bazi-chart">
                <h4>八字命盘</h4>
                <div class="pillars-container">
                    <div class="pillar">
                        <div class="pillar-label">年柱</div>
                        <div class="pillar-chars">${yearPillar}</div>
                        <div class="pillar-god">${yearTenGod}</div>
                        <div class="pillar-wuxing">
                            <span class="wuxing-tiangan">${yearPillar[0]}(${wuxingInfo?.year?.tianGan || ''})</span>
                            <span class="wuxing-dizhi">${yearPillar[1]}(${wuxingInfo?.year?.diZhi || ''})</span>
                        </div>
                        <div class="pillar-nayin">${naYinInfo?.year || '未知'}</div>
                    </div>
                    <div class="pillar">
                        <div class="pillar-label">月柱</div>
                        <div class="pillar-chars">${monthPillar}</div>
                        <div class="pillar-god">${monthTenGod}</div>
                        <div class="pillar-wuxing">
                            <span class="wuxing-tiangan">${monthPillar[0]}(${wuxingInfo?.month?.tianGan || ''})</span>
                            <span class="wuxing-dizhi">${monthPillar[1]}(${wuxingInfo?.month?.diZhi || ''})</span>
                        </div>
                        <div class="pillar-nayin">${naYinInfo?.month || '未知'}</div>
                    </div>
                    <div class="pillar">
                        <div class="pillar-label">日柱</div>
                        <div class="pillar-chars">${dayPillar}</div>
                        <div class="pillar-god">日元</div>
                        <div class="pillar-wuxing">
                            <span class="wuxing-tiangan">${dayPillar[0]}(${wuxingInfo?.day?.tianGan || ''})</span>
                            <span class="wuxing-dizhi">${dayPillar[1]}(${wuxingInfo?.day?.diZhi || ''})</span>
                        </div>
                        <div class="pillar-nayin">${naYinInfo?.day || '未知'}</div>
                    </div>
                    <div class="pillar">
                        <div class="pillar-label">时柱</div>
                        <div class="pillar-chars">${hourPillar}</div>
                        <div class="pillar-god">${hourTenGod}</div>
                        <div class="pillar-wuxing">
                            <span class="wuxing-tiangan">${hourPillar[0]}(${wuxingInfo?.hour?.tianGan || ''})</span>
                            <span class="wuxing-dizhi">${hourPillar[1]}(${wuxingInfo?.hour?.diZhi || ''})</span>
                        </div>
                        <div class="pillar-nayin">${naYinInfo?.hour || '未知'}</div>
                    </div>
                </div>
            </div>

            ${baziResult.trueSolarTimeInfo ? `
            <div class="true-solar-time-section">
                <h4>真太阳时修正</h4>
                <div class="time-correction-info">
                    <div class="time-row">
                        <span class="time-label">原始时间：</span>
                        <span class="time-value">${baziResult.trueSolarTimeInfo.originalTime}</span>
                    </div>
                    <div class="time-row">
                        <span class="time-label">修正时间：</span>
                        <span class="time-value">${baziResult.trueSolarTimeInfo.correctedTime}</span>
                    </div>
                    <div class="time-row">
                        <span class="time-label">出生地点：</span>
                        <span class="time-value">${baziResult.trueSolarTimeInfo.location}</span>
                    </div>
                    <div class="time-row">
                        <span class="time-label">经度：</span>
                        <span class="time-value">${baziResult.trueSolarTimeInfo.longitude.toFixed(1)}°E</span>
                    </div>
                    <div class="time-row">
                        <span class="time-label">总修正：</span>
                        <span class="time-value ${baziResult.trueSolarTimeInfo.correction >= 0 ? 'positive' : 'negative'}">
                            ${baziResult.trueSolarTimeInfo.correction >= 0 ? '+' : ''}${baziResult.trueSolarTimeInfo.correction.toFixed(1)}分钟
                        </span>
                    </div>
                    <div class="correction-details">
                        <small>
                            经度修正：${baziResult.trueSolarTimeInfo.longitudeCorrection >= 0 ? '+' : ''}${baziResult.trueSolarTimeInfo.longitudeCorrection.toFixed(1)}分钟 |
                            时间方程：${baziResult.trueSolarTimeInfo.timeEquation >= 0 ? '+' : ''}${baziResult.trueSolarTimeInfo.timeEquation.toFixed(1)}分钟
                        </small>
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="dayun-section">
                <h4>大运信息</h4>
                <div class="dayun-info">
                    <p>起运年龄：${bigLuck.startYear - year}岁（${bigLuck.startYear}年）</p>
                    <div class="dayun-pillars">
                        ${bigLuck.dayun.map((pillar, index) => `
                            <div class="dayun-pillar">
                                <div class="dayun-age">${bigLuck.startYear - year + index * 10}-${bigLuck.startYear - year + (index + 1) * 10 - 1}岁</div>
                                <div class="dayun-chars">${pillar}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            ${this.buildZiweiSection(ziweiResult, birthData)}

            <div class="ai-analysis">
                <h4>AI命理分析</h4>

                <!-- 分析选项 -->
                <div class="analysis-options">
                    <label class="option-checkbox">
                        <input type="checkbox" id="add-ziwei-analysis" checked>
                        <span class="checkmark"></span>
                        包含紫薇斗数分析
                    </label>
                </div>

                <!-- AI分析自动开始，无需手动按钮 -->

                <!-- 处理状态显示 -->
                <div class="processing-box" id="ai-processing-box" style="display: none;">
                    <div class="processing-message" id="ai-processing-message">正在初始化AI分析...</div>
                    <div class="processing-steps" id="ai-processing-steps"></div>
                </div>

                <!-- AI分析结果 -->
                <div class="ai-result-section" id="ai-result-section" style="display: none;">
                    <h5>AI分析结果：</h5>
                    <div class="ai-output" id="ai-output"></div>
                    <div class="result-actions">
                        <button class="cyber-button" id="copy-ai-result" style="display: none;">
                            <span>复制分析结果</span>
                            <div class="button-glow"></div>
                        </button>
                    </div>
                </div>

                <!-- 错误信息显示 -->
                <div class="api-error-message" id="ai-error-message" style="display: none;"></div>

                <!-- 提示词已隐藏，保护商业机密 -->
            </div>

            <div class="result-actions">
                <div class="download-options">
                    <button class="cyber-button" id="download-pdf-btn">
                        <span>生成 PDF 报告</span>
                        <div class="button-glow"></div>
                    </button>
                    <button class="cyber-button secondary" id="download-text-btn">
                        <span>下载文本报告</span>
                        <div class="button-glow"></div>
                    </button>
                    <button class="cyber-button" id="test-canvas-btn" style="background: linear-gradient(135deg, #8a4a44, #6d3a36);">
                        <span>测试 Canvas</span>
                        <div class="button-glow"></div>
                    </button>
                </div>
                <div class="download-note">
                    <small>提示：PDF 报告将在新窗口中打开，您可以使用浏览器的"打印"功能保存为 PDF</small>
                </div>
            </div>
        `;
    }

    // 绑定AI分析相关事件
    bindAIAnalysisEvents(birthData, baziResult, prompt, ziweiResult) {
        // AI分析现在自动开始，无需手动按钮
        const copyBtn = document.getElementById('copy-ai-result');
        const downloadPdfBtn = document.getElementById('download-pdf-btn');
        const downloadTextBtn = document.getElementById('download-text-btn');

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyAIResult();
            });
        }

        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', () => {
                this.downloadPDFReport();
            });
        }

        if (downloadTextBtn) {
            downloadTextBtn.addEventListener('click', () => {
                this.downloadTextReport();
            });
        }

        const testCanvasBtn = document.getElementById('test-canvas-btn');
        if (testCanvasBtn) {
            testCanvasBtn.addEventListener('click', () => {
                this.testCanvasGeneration();
            });
        }
    }

    // 生成AI分析
    async generateAIAnalysis(birthData, baziResult, prompt, ziweiResult) {
        // 使用全局配置
        const globalConfig = this.getGlobalConfig();
        if (!globalConfig) {
            this.showAIError('请先在右上角配置AI设置');
            return;
        }

        const apiUrl = globalConfig.apiUrl;
        const apiKey = globalConfig.apiKey;
        const modelName = String(globalConfig.model || '').trim();
        const includeZiwei = document.getElementById('add-ziwei-analysis').checked;

        // 验证输入
        if (!apiKey) {
            this.showAIError('请输入API密钥');
            return;
        }
        if (!apiUrl) {
            this.showAIError('请输入API地址');
            return;
        }

        // 显示处理状态
        this.showAIProcessing();

        try {
            // 生成完整的分析提示词
            let fullPrompt = prompt;
            if (includeZiwei && ziweiResult) {
                const ziweiPrompt = this.generateZiweiPrompt(ziweiResult);
                fullPrompt += '\n\n' + ziweiPrompt;
            }

            // 调用AI API
            await this.callAIAPI(fullPrompt, apiKey, modelName, apiUrl);

        } catch (error) {
            console.error('AI分析错误:', error);
            this.showAIError(`AI分析失败: ${error.message}`);
        } finally {
            this.hideAIProcessing();
        }
    }

    // 构建紫薇斗数分析部分
    buildZiweiSection(ziweiResult, birthData) {
        if (!ziweiResult || ziweiResult.available === false) {
            return `
                <div class="ziwei-section">
                    <h4>紫薇斗数分析</h4>
                    <div class="ziwei-unavailable">
                        <p>紫薇斗数命盘未生成</p>
                        <p>${ziweiResult?.warning || '计算库暂时不可用，请刷新页面后重试。'}</p>
                        ${ziweiResult?.errorCode ? `<small>错误代码：${ziweiResult.errorCode}</small>` : ''}
                    </div>
                </div>
            `;
        }

        // 生成紫薇斗数分析
        const summary = this.ziweiCalculator ? this.ziweiCalculator.generateSummary(ziweiResult) : '无法生成分析';
        const reading = this.ziweiInterpreter ? this.ziweiInterpreter.interpret(ziweiResult) : null;

        return `
            <div class="ziwei-section">
                <h4>紫薇斗数分析</h4>
                <div class="ziwei-content">
                    <section class="ziwei-chart-panel" aria-labelledby="ziwei-chart-title">
                        <div class="ziwei-chart-header">
                            <div>
                                <h5 id="ziwei-chart-title">完整互动星盘</h5>
                                <p>点击宫干查看飞化，使用中宫按钮切换大限、流年、流月、流日和流时。</p>
                            </div>
                            <span class="ziwei-chart-badge">react-iztro</span>
                        </div>
                        <div class="ziwei-chart-viewport" tabindex="0" aria-label="紫微斗数互动星盘，可横向滚动查看完整内容">
                            <div class="ziwei-chart-frame">
                                <div id="ziwei-chart-root" aria-busy="true">
                                    <div class="ziwei-chart-loading" role="status">正在绘制完整星盘…</div>
                                </div>
                            </div>
                        </div>
                        <div class="ziwei-chart-fallback" role="status" hidden>
                            互动星盘加载失败，下方结构化命盘仍可正常使用。
                        </div>
                    </section>

                    ${this.buildZiweiReading(reading)}

                    <div class="ziwei-basic-info">
                        <div class="info-row">
                            <span class="info-label">计算方法：</span>
                            <span class="info-value">${ziweiResult.calculationMethod === 'iztro' ? '专业算法' : '简化算法'}</span>
                        </div>
                        ${ziweiResult.solarDate ? `
                            <div class="info-row">
                                <span class="info-label">阳历日期：</span>
                                <span class="info-value">${ziweiResult.solarDate}</span>
                            </div>
                        ` : ''}
                        ${ziweiResult.lunarDate ? `
                            <div class="info-row">
                                <span class="info-label">农历日期：</span>
                                <span class="info-value">${ziweiResult.lunarDate}</span>
                            </div>
                        ` : ''}
                        ${ziweiResult.fiveElementsClass ? `
                            <div class="info-row">
                                <span class="info-label">五行局：</span>
                                <span class="info-value">${ziweiResult.fiveElementsClass}</span>
                            </div>
                        ` : ''}
                    </div>

                    <details class="ziwei-analysis ziwei-technical-summary">
                        <summary>查看专业排盘摘要</summary>
                        <div class="analysis-text">
                            <pre>${this.escapeHTML(summary)}</pre>
                        </div>
                    </details>

                    ${ziweiResult.palaces && ziweiResult.palaces.length > 0 ? `
                        <div class="ziwei-palaces">
                            <h5>十二宫概览：</h5>
                            <div class="palaces-grid">
                                ${ziweiResult.palaces.slice(0, 6).map(palace => `
                                    <div class="palace-item">
                                        <div class="palace-name">${palace.name}</div>
                                        <div class="palace-branch">${palace.earthlyBranch}</div>
                                        ${palace.majorStars && palace.majorStars.length > 0 ? `
                                            <div class="palace-stars">${palace.majorStars.slice(0, 2).join('、')}</div>
                                        ` : '<div class="palace-empty">空宫</div>'}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${ziweiResult.warning ? `
                        <div class="ziwei-warning">
                            <p>⚠️ ${ziweiResult.warning}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    buildZiweiReading(reading) {
        if (!reading?.available || !reading.overview || !Array.isArray(reading.sections)) {
            return `
                <section class="ziwei-reading ziwei-reading-unavailable" aria-labelledby="ziwei-reading-title">
                    <h5 id="ziwei-reading-title">一眼看懂这张盘</h5>
                    <p>白话解读暂时不可用，请先查看下方专业排盘摘要。</p>
                </section>
            `;
        }

        const tags = (reading.overview.tags || [])
            .map((tag) => `<li>${this.escapeHTML(tag)}</li>`)
            .join('');
        const sections = reading.sections.map((section, index) => `
            <article class="ziwei-reading-item" data-reading-domain="${this.escapeHTML(section.id)}">
                <header class="ziwei-reading-item-header">
                    <span class="ziwei-reading-index">${String(index + 1).padStart(2, '0')}</span>
                    <h6>${this.escapeHTML(section.title)}</h6>
                </header>
                <p class="ziwei-reading-summary">${this.escapeHTML(section.summary)}</p>
                <dl class="ziwei-reading-details">
                    <div>
                        <dt>容易发挥</dt>
                        <dd>${this.escapeHTML(section.strengths)}</dd>
                    </div>
                    <div>
                        <dt>需要留意</dt>
                        <dd>${this.escapeHTML(section.watchFor)}</dd>
                    </div>
                    <div>
                        <dt>实用建议</dt>
                        <dd>${this.escapeHTML(section.advice)}</dd>
                    </div>
                    <div class="ziwei-reading-evidence">
                        <dt>怎么看出来的</dt>
                        <dd>${this.escapeHTML(section.evidence)}</dd>
                    </div>
                </dl>
                ${section.disclaimer ? `<p class="ziwei-reading-item-note">${this.escapeHTML(section.disclaimer)}</p>` : ''}
            </article>
        `).join('');

        return `
            <section class="ziwei-reading" aria-labelledby="ziwei-reading-title">
                <header class="ziwei-reading-header">
                    <div>
                        <span class="ziwei-reading-kicker">本命盘白话解读</span>
                        <h5 id="ziwei-reading-title">一眼看懂这张盘</h5>
                    </div>
                    <p>先读结论，再看依据；不需要认识星曜也能理解。</p>
                </header>
                <div class="ziwei-reading-overview">
                    <h6>${this.escapeHTML(reading.overview.headline)}</h6>
                    <p>${this.escapeHTML(reading.overview.summary)}</p>
                    ${tags ? `<ul aria-label="命盘核心标签">${tags}</ul>` : ''}
                </div>
                <div class="ziwei-reading-list">
                    ${sections}
                </div>
                <p class="ziwei-reading-disclaimer">${this.escapeHTML(reading.disclaimer)}</p>
            </section>
        `;
    }

    mountZiweiChart(birthData, ziweiResult) {
        if (!ziweiResult || ziweiResult.available === false) return false;
        const root = document.getElementById('ziwei-chart-root');
        const fallback = document.querySelector('.ziwei-chart-fallback');
        if (!root) return false;

        const showFallback = (message) => {
            root.setAttribute('aria-busy', 'false');
            if (fallback) {
                fallback.textContent = message || '互动星盘加载失败，下方结构化命盘仍可正常使用。';
                fallback.hidden = false;
            }
        };

        if (!window.ZiweiChart?.mount) {
            showFallback('互动星盘资源未加载，下方结构化命盘仍可正常使用。');
            return false;
        }

        try {
            const result = window.ZiweiChart.mount(root, birthData, {
                onError: () => showFallback('互动星盘渲染失败，下方结构化命盘仍可正常使用。')
            });
            if (!result?.ok) {
                showFallback(result?.error);
                return false;
            }
            requestAnimationFrame(() => root.setAttribute('aria-busy', 'false'));
            return true;
        } catch (error) {
            console.error('互动紫微星盘渲染失败:', error);
            showFallback();
            return false;
        }
    }

    // 复制提示词功能已移除，保护商业机密

    // 生成PDF报告（使用打印预览）
    async downloadPDFReport() {
        const resultContent = document.querySelector('#zhiming-result .result-content');
        if (!resultContent) {
            this.showError('没有可下载的报告内容');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=960,height=720');
        if (!printWindow) {
            this.showError('报告窗口被浏览器拦截，请允许弹出窗口后重试');
            return;
        }

        this.showProcessing('正在准备PDF报告...');
        try {
            const hasZiweiChart = Boolean(
                resultContent.querySelector?.('.ziwei-chart-frame') &&
                resultContent.querySelector?.('#ziwei-chart-root')
            );
            const chartImageDataUrl = hasZiweiChart
                ? await this.captureZiweiChartImage(resultContent)
                : null;
            this.hideProcessing();
            this.openPrintPreview(printWindow, { chartImageDataUrl });
        } catch (error) {
            this.hideProcessing();
            printWindow.close?.();
            console.error('PDF报告生成失败:', error);
            this.showError(`PDF报告生成失败：${error.message}`);
        }
    }

    // 长图下载功能已移除，简化界面

    // 下载文本报告
    downloadTextReport() {
        const resultContent = document.querySelector('#zhiming-result .result-content');
        if (!resultContent) {
            this.showError('没有可下载的报告内容');
            return;
        }

        // 生成完整报告文本
        const reportText = this.generateCompleteReport();

        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `赛博论命文本报告_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        this.showSuccess('文本报告已下载');
    }

    // 生成完整报告文本
    generateCompleteReport() {
        const resultContent = document.querySelector('#zhiming-result .result-content');
        if (!resultContent) return '';

        let report = '';

        // 报告标题
        report += '赛博论命 - 完整命理分析报告\n';
        report += '='.repeat(60) + '\n\n';

        // 基本信息
        const title = resultContent.querySelector('.result-title')?.textContent || '';
        const info = resultContent.querySelector('.result-info')?.textContent || '';
        if (title) {
            report += `${title}\n`;
            report += '-'.repeat(30) + '\n';
        }
        if (info) {
            report += `${info}\n\n`;
        }

        // 八字命盘信息
        report += this.extractBaziInfo(resultContent);

        // 真太阳时修正信息
        report += this.extractSolarTimeInfo(resultContent);

        // 大运信息
        report += this.extractDayunInfo(resultContent);

        // 紫薇斗数信息
        report += this.extractZiweiInfo(resultContent);

        // AI分析结果
        report += this.extractAIAnalysis();

        // 报告生成时间
        report += '\n' + '='.repeat(60) + '\n';
        report += `报告生成时间：${new Date().toLocaleString('zh-CN')}\n`;
        report += '本报告由赛博论命系统生成\n';

        return report;
    }

    // 提取八字命盘信息
    extractBaziInfo(resultContent) {
        let info = '八字命盘\n';
        info += '-'.repeat(20) + '\n';

        // 提取八字
        const pillars = resultContent.querySelectorAll('.pillar');
        if (pillars.length > 0) {
            const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
            pillars.forEach((pillar, index) => {
                const chars = pillar.querySelector('.pillar-chars')?.textContent || '';
                const god = pillar.querySelector('.pillar-god')?.textContent || '';
                const wuxingElements = pillar.querySelectorAll('.wuxing-tag');
                const nayin = pillar.querySelector('.pillar-nayin')?.textContent || '';

                info += `${pillarNames[index] || ''}：${chars}`;
                if (god && god !== '日元') {
                    info += ` (${god})`;
                }
                info += '\n';

                if (wuxingElements.length > 0) {
                    const wuxingTexts = Array.from(wuxingElements).map(el => el.textContent);
                    info += `  五行：${wuxingTexts.join(' ')}\n`;
                }

                if (nayin) {
                    info += `  纳音：${nayin}\n`;
                }
            });
        }

        return info + '\n';
    }

    // 提取真太阳时修正信息
    extractSolarTimeInfo(resultContent) {
        const solarTimeSection = resultContent.querySelector('.solar-time-section');
        if (!solarTimeSection) return '';

        let info = '真太阳时修正\n';
        info += '-'.repeat(20) + '\n';

        const timeRows = solarTimeSection.querySelectorAll('.time-row');
        timeRows.forEach(row => {
            const label = row.querySelector('.time-label')?.textContent || '';
            const value = row.querySelector('.time-value')?.textContent || '';
            if (label && value) {
                info += `${label}${value}\n`;
            }
        });

        return info + '\n';
    }

    // 提取大运信息
    extractDayunInfo(resultContent) {
        const dayunSection = resultContent.querySelector('.dayun-section');
        if (!dayunSection) return '';

        let info = '大运信息\n';
        info += '-'.repeat(20) + '\n';

        const dayunInfo = dayunSection.querySelector('.dayun-info p')?.textContent || '';
        if (dayunInfo) {
            info += `${dayunInfo}\n`;
        }

        const dayunPillars = dayunSection.querySelectorAll('.dayun-pillar');
        if (dayunPillars.length > 0) {
            info += '大运排列：\n';
            dayunPillars.forEach(pillar => {
                const age = pillar.querySelector('.dayun-age')?.textContent || '';
                const chars = pillar.querySelector('.dayun-chars')?.textContent || '';
                if (age && chars) {
                    info += `  ${age}：${chars}\n`;
                }
            });
        }

        return info + '\n';
    }

    // 提取紫薇斗数信息
    extractZiweiInfo(resultContent) {
        const ziweiSection = resultContent.querySelector('.ziwei-section');
        if (!ziweiSection) return '';

        let info = '紫薇斗数分析\n';
        info += '-'.repeat(20) + '\n';

        // 基本信息
        const basicInfo = ziweiSection.querySelector('.ziwei-basic-info');
        if (basicInfo) {
            const infoRows = basicInfo.querySelectorAll('.info-row');
            infoRows.forEach(row => {
                const label = row.querySelector('.info-label')?.textContent || '';
                const value = row.querySelector('.info-value')?.textContent || '';
                if (label && value) {
                    info += `${label}${value}\n`;
                }
            });
            info += '\n';
        }

        // 命盘分析
        const analysis = ziweiSection.querySelector('.analysis-text pre')?.textContent || '';
        if (analysis) {
            info += '命盘分析：\n';
            info += analysis + '\n\n';
        }

        // 十二宫概览
        const palaces = ziweiSection.querySelectorAll('.palace-item');
        if (palaces.length > 0) {
            info += '十二宫概览：\n';
            palaces.forEach(palace => {
                const name = palace.querySelector('.palace-name')?.textContent || '';
                const branch = palace.querySelector('.palace-branch')?.textContent || '';
                const stars = palace.querySelector('.palace-stars')?.textContent ||
                            palace.querySelector('.palace-empty')?.textContent || '';
                if (name && branch) {
                    info += `  ${name}(${branch})：${stars}\n`;
                }
            });
        }

        return info + '\n';
    }

    // 提取AI分析结果
    extractAIAnalysis() {
        const aiOutput = document.getElementById('ai-output');
        if (!aiOutput || !this.fullAIResponse) return '';

        let info = 'AI智能分析\n';
        info += '-'.repeat(20) + '\n';

        // 使用原始的AI响应文本，去除Markdown格式
        const cleanText = this.fullAIResponse
            .replace(/\*\*(.*?)\*\*/g, '$1')  // 移除粗体标记
            .replace(/\*(.*?)\*/g, '$1')      // 移除斜体标记
            .replace(/### (.*?)$/gm, '$1')    // 移除三级标题标记
            .replace(/## (.*?)$/gm, '$1')     // 移除二级标题标记
            .replace(/# (.*?)$/gm, '$1')      // 移除一级标题标记
            .replace(/\n\n+/g, '\n\n');       // 规范化换行

        info += cleanText + '\n\n';

        return info;
    }

    // 处理赛博起名表单提交
    async handleQimingSubmit(e) {
        const form = e.target;
        if (this.formAssistant && !this.formAssistant.validate(form)) return;
        const formData = new FormData(form);

        const birthData = {
            surname: formData.get('surname'),
            gender: formData.get('gender'),
            year: parseInt(formData.get('birthYear')),
            month: parseInt(formData.get('birthMonth')),
            day: parseInt(formData.get('birthDay')),
            hour: parseInt(formData.get('birthHour')),
            minute: parseInt(formData.get('birthMinute')),
            birthProvince: formData.get('birthProvince'),
            birthCity: formData.get('birthCity'),
            // 新的自定义字配置
            customConfig: {
                firstChar: formData.get('firstChar')?.trim() || null,
                secondChar: formData.get('secondChar')?.trim() || null,
                candidateChars: formData.get('candidateChars')?.split(',').map(s => s.trim()).filter(s => s) || []
            }
        };

        if (!this.validateQimingData(birthData)) {
            this.showError('请填写完整的信息');
            return;
        }

        window.FormAssistant?.saveRecent(birthData);

        this.showLoading();

        try {
            // 计算八字
            const baziResult = this.baziCalculator.calculate(birthData);

            // 生成名字建议
            const nameSuggestions = this.nameCalculator.generateNameSuggestions(
                birthData.surname,
                birthData.gender,
                baziResult,
                birthData.customConfig
            );

            // 调试：检查名字建议数据结构
            console.log('名字建议数据结构:', nameSuggestions);
            if (nameSuggestions.length > 0) {
                console.log('第一个建议的详细结构:', nameSuggestions[0]);
                console.log('wuGe结构:', nameSuggestions[0].wuGe);
                console.log('sanCai结构:', nameSuggestions[0].sanCai);
                console.log('wuXingMatch结构:', nameSuggestions[0].wuXingMatch);
            }

            // 生成AI分析提示词
            const aiPrompt = this.nameCalculator.generateCompleteAINamingPrompt(
                birthData,
                baziResult,
                nameSuggestions,
                birthData.customConfig
            );

            this.displayQimingResult(birthData, baziResult, nameSuggestions, aiPrompt);

        } catch (error) {
            console.error('起名错误:', error);
            this.showError('起名过程中出现错误，请重试');
        } finally {
            this.hideLoading();
        }
    }

    // 处理赛博测名表单提交
    async handleCemingSubmit(e) {
        const form = e.target;
        if (this.formAssistant && !this.formAssistant.validate(form)) return;
        const formData = new FormData(form);

        const testData = {
            fullName: formData.get('fullName'),
            gender: formData.get('gender'),
            year: parseInt(formData.get('birthYear')),
            month: parseInt(formData.get('birthMonth')),
            day: parseInt(formData.get('birthDay')),
            hour: parseInt(formData.get('birthHour')),
            minute: parseInt(formData.get('birthMinute')) || 0,
            birthProvince: formData.get('birthProvince'),
            birthCity: formData.get('birthCity')
        };

        if (!this.validateCemingData(testData)) {
            this.showError('请填写完整的信息');
            return;
        }

        window.FormAssistant?.saveRecent(testData);

        this.showLoading();

        try {
            // 计算八字
            const baziResult = this.baziCalculator.calculate(testData);

            // 分析姓名
            const nameAnalysis = this.nameCalculator.analyzeName(testData.fullName, baziResult);

            this.displayCemingResult(testData, nameAnalysis, baziResult);

        } catch (error) {
            console.error('测名错误:', error);
            this.showError('测名过程中出现错误，请重试');
        } finally {
            this.hideLoading();
        }
    }

    // 处理赛博合婚表单提交
    async handleHehunSubmit(e) {
        const form = e.target;
        if (this.formAssistant && !this.formAssistant.validate(form)) return;
        const formData = new FormData(form);

        const marriageData = {
            male: {
                name: formData.get('maleName'),
                year: parseInt(formData.get('maleBirthYear')),
                month: parseInt(formData.get('maleBirthMonth')),
                day: parseInt(formData.get('maleBirthDay')),
                hour: parseInt(formData.get('maleBirthHour')),
                minute: parseInt(formData.get('maleBirthMinute')) || 0,
                birthProvince: formData.get('maleBirthProvince'),
                birthCity: formData.get('maleBirthCity'),
                gender: '男'
            },
            female: {
                name: formData.get('femaleName'),
                year: parseInt(formData.get('femaleBirthYear')),
                month: parseInt(formData.get('femaleBirthMonth')),
                day: parseInt(formData.get('femaleBirthDay')),
                hour: parseInt(formData.get('femaleBirthHour')),
                minute: parseInt(formData.get('femaleBirthMinute')) || 0,
                birthProvince: formData.get('femaleBirthProvince'),
                birthCity: formData.get('femaleBirthCity'),
                gender: '女'
            }
        };

        if (!this.validateHehunData(marriageData)) {
            this.showError('请填写完整的双方信息');
            return;
        }

        // 表单顺序上女方为最后一组资料，因此作为“最近使用”保存；姓名不进入存储。
        window.FormAssistant?.saveRecent(marriageData.female);

        this.showLoading();

        try {
            // 计算双方八字
            const maleBazi = this.baziCalculator.calculate(marriageData.male);
            const femaleBazi = this.baziCalculator.calculate(marriageData.female);

            // 合婚分析
            const marriageResult = this.marriageCalculator.calculateMarriageMatch(
                { birthData: marriageData.male, baziResult: maleBazi, name: marriageData.male.name },
                { birthData: marriageData.female, baziResult: femaleBazi, name: marriageData.female.name }
            );

            this.displayHehunResult(marriageData, marriageResult);

        } catch (error) {
            console.error('合婚错误:', error);
            this.showError('合婚过程中出现错误，请重试');
        } finally {
            this.hideLoading();
        }
    }

    // 验证起名数据
    validateQimingData(data) {
        return data.surname && data.gender && data.year && data.month && data.day &&
               data.hour !== null && data.minute !== null && data.birthProvince && data.birthCity;
    }

    // 验证测名数据
    validateCemingData(data) {
        return data.fullName && data.gender && data.year && data.month && data.day &&
               data.hour !== null && data.birthProvince && data.birthCity;
    }

    // 验证合婚数据
    validateHehunData(data) {
        const { male, female } = data;
        return male.name && male.year && male.month && male.day && male.hour !== null &&
               male.minute !== null && male.birthProvince && male.birthCity &&
               female.name && female.year && female.month && female.day && female.hour !== null &&
               female.minute !== null && female.birthProvince && female.birthCity;
    }

    // 显示起名结果
    displayQimingResult(birthData, baziResult, nameSuggestions, aiPrompt) {
        const resultPanel = document.getElementById('qiming-result');
        if (!resultPanel) return;
        const resultContent = resultPanel.querySelector('.result-content');
        if (!resultContent) return;

        const generationId = ++this.namingAnalysisGeneration;
        clearTimeout(this.namingAnalysisTimer);
        this.namingAnalysisAbortController?.abort();
        this.namingAnalysisAbortController = null;
        this.fullAINamingResponse = '';
        this.aiNamingTop5Result = null;

        const resultHTML = `
            <div class="result-header">
                <h3 class="result-title">智能起名结果</h3>
                <div class="result-info">
                    <span>姓氏：${this.escapeHTML(birthData.surname)} | 性别：${birthData.gender} | 出生：${birthData.year}年${birthData.month}月${birthData.day}日${birthData.hour}时</span>
                </div>
            </div>

            <!-- 八字信息 -->
            <div class="bazi-info">
                <h4>生辰八字</h4>
                <div class="bazi-pillars">
                    <div class="pillar">
                        <div class="pillar-label">年柱</div>
                        <div class="pillar-chars">${baziResult.yearPillar}</div>
                        <div class="pillar-wuxing">${this.getPillarWuXing(baziResult.yearPillar)}</div>
                        <div class="pillar-god">${baziResult.yearTenGod}</div>
                    </div>
                    <div class="pillar">
                        <div class="pillar-label">月柱</div>
                        <div class="pillar-chars">${baziResult.monthPillar}</div>
                        <div class="pillar-wuxing">${this.getPillarWuXing(baziResult.monthPillar)}</div>
                        <div class="pillar-god">${baziResult.monthTenGod}</div>
                    </div>
                    <div class="pillar">
                        <div class="pillar-label">日柱</div>
                        <div class="pillar-chars">${baziResult.dayPillar}</div>
                        <div class="pillar-wuxing">${this.getPillarWuXing(baziResult.dayPillar)}</div>
                        <div class="pillar-god">日主${baziResult.dayTianGan}</div>
                    </div>
                    <div class="pillar">
                        <div class="pillar-label">时柱</div>
                        <div class="pillar-chars">${baziResult.hourPillar}</div>
                        <div class="pillar-wuxing">${this.getPillarWuXing(baziResult.hourPillar)}</div>
                        <div class="pillar-god">${baziResult.hourTenGod}</div>
                    </div>
                </div>

                <!-- 五行分析 -->
                <div class="wuxing-analysis">
                    <h5>五行分析</h5>
                    <div class="wuxing-stats">
                        ${this.generateWuXingStats(baziResult)}
                    </div>
                    <div class="wuxing-needs">
                        <span class="needs-label">起名宜用五行：</span>
                        <span class="needs-values">${this.nameCalculator.analyzeBaziWuXing(baziResult).join('、')}</span>
                    </div>
                </div>
            </div>

            <!-- AI分析区域 -->
            <div class="ai-naming-analysis">
                ${this.generateCustomConfigDisplay(birthData.customConfig)}
                <div class="ai-naming-header">
                    <h4>AI综合起名推荐</h4>
                    <p>系统会先检索已核验的经典文学语料，形成高质量候选池，再只展示综合排名最高的 5 个名字及其推荐理由。</p>
                    <p class="model-selection-note">AI 分析将使用全局配置中当前填写的模型；模型名称由服务商接口或你手动输入决定。</p>
                </div>

                <div class="ai-naming-top5" id="ai-naming-top5" aria-live="polite">
                    <div class="ai-naming-top5-empty" id="ai-naming-top5-empty">正在检索经典文学语料并准备 AI 排名，完成后将展示前 5 及推荐理由。</div>
                    <div class="names-grid ai-naming-top5-grid" id="ai-naming-top5-grid"></div>
                </div>

                <!-- AI分析自动开始，无需手动按钮 -->

                <!-- 处理状态显示 -->
                <div class="processing-box" id="ai-naming-processing" style="display: none;">
                    <div class="processing-message" id="ai-naming-processing-message">正在初始化AI分析...</div>
                    <div class="processing-steps" id="ai-naming-processing-steps"></div>
                </div>

                <!-- AI分析结果 -->
                <div class="ai-result-section" id="ai-naming-result-section" style="display: none;">
                    <h5>AI深度分析结果：</h5>
                    <div class="ai-output" id="ai-naming-output"></div>
                    <div class="result-actions">
                        <button class="cyber-button" id="copy-ai-naming-result" style="display: none;">
                            <span>复制分析结果</span>
                            <div class="button-glow"></div>
                        </button>
                    </div>
                </div>

                <!-- 错误信息显示 -->
                <div class="api-error-message" id="ai-naming-error-message" style="display: none;"></div>

                <!-- 提示词已隐藏，保护商业机密 -->
            </div>

            <!-- PDF报告下载 -->
            <div class="result-actions">
                <div class="download-options">
                    <button class="cyber-button" id="download-naming-pdf-btn" disabled aria-disabled="true">
                        <span>生成 PDF 报告</span>
                        <div class="button-glow"></div>
                    </button>
                    <button class="cyber-button secondary" id="download-naming-text-btn" disabled aria-disabled="true">
                        <span>下载文本报告</span>
                        <div class="button-glow"></div>
                    </button>
                </div>
                <div class="download-note">
                    <small>提示：PDF 报告将在新窗口中打开，您可以使用浏览器的"打印"功能保存为 PDF</small>
                </div>
            </div>
        `;

        resultContent.innerHTML = resultHTML;

        // 绑定AI起名分析事件
        this.bindAINamingEvents(birthData, baziResult, nameSuggestions, aiPrompt);

        // 绑定PDF下载事件
        this.bindNamingDownloadEvents(birthData, baziResult, nameSuggestions);

        // 显示结果面板
        resultPanel.style.display = 'block';
        resultPanel.classList.add('show');
        resultPanel.closest('.content-container')?.classList.add('has-result');
        resultPanel.scrollIntoView({ behavior: 'smooth' });

        // 自动开始AI起名分析
        this.namingAnalysisTimer = setTimeout(() => {
            if (generationId !== this.namingAnalysisGeneration) return;
            console.log('自动开始起名AI分析...');
            this.generateAINamingAnalysis(birthData, baziResult, nameSuggestions, aiPrompt, generationId);
        }, 1000); // 延迟1秒，确保界面渲染完成
    }

    getAvailableNameElements(nameSuggestions) {
        return [...new Set(nameSuggestions.flatMap((suggestion) => suggestion.wuXingMatch || []).filter(Boolean))];
    }

    escapeHTML(value) {
        return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        })[character]);
    }

    loadNameFavorites() {
        try {
            const value = JSON.parse(localStorage.getItem('cyberFortune_nameFavorites') || '[]');
            return Array.isArray(value)
                ? [...new Set(value.filter((name) => typeof name === 'string' && name.trim()).map((name) => name.trim()))].slice(0, 50)
                : [];
        } catch (error) {
            return [];
        }
    }

    saveNameFavorites(names) {
        const safeNames = [...new Set(names.filter((name) => typeof name === 'string' && name.trim()).map((name) => name.trim()))].slice(0, 50);
        try {
            localStorage.setItem('cyberFortune_nameFavorites', JSON.stringify(safeNames));
        } catch (error) {
            console.warn('名字收藏暂时无法保存到浏览器:', error);
        }
        return safeNames;
    }

    renderNameSuggestionCards(nameSuggestions) {
        const favorites = new Set(this.loadNameFavorites());
        if (!nameSuggestions.length) {
            return '<div class="name-empty-state">当前条件下没有结果，请调整筛选或换一批名字。</div>';
        }

        return nameSuggestions.map((suggestion, index) => {
            const fullName = this.escapeHTML(suggestion.fullName);
            const isFavorite = favorites.has(suggestion.fullName);
            const elements = (suggestion.wuXingMatch || []).filter(Boolean);
            const source = suggestion.source || {};
            const wuGe = suggestion.wuGe || {};
            const sanCai = suggestion.sanCai || {};

            return `
                <article class="name-card ${suggestion.isCustom ? 'custom-name' : ''}" data-name="${fullName}" data-score="${Number(suggestion.score) || 0}" data-elements="${this.escapeHTML(elements.join(','))}">
                    <div class="name-card-topline">
                        <div class="name-rank">${index + 1}</div>
                        ${suggestion.isCustom ? `<div class="custom-badge">${this.escapeHTML(suggestion.customType)}</div>` : ''}
                        <button class="name-favorite-button ${isFavorite ? 'is-favorite' : ''}" type="button"
                                data-favorite-name="${fullName}" aria-pressed="${isFavorite}"
                                aria-label="${isFavorite ? '取消收藏' : '收藏'} ${fullName}">${isFavorite ? '★ 已收藏' : '☆ 收藏'}</button>
                    </div>
                    <div class="name-card-identity">
                        <div class="name-text">${fullName}</div>
                        <div class="name-score"><strong>${Number(suggestion.score) || 0}</strong><span>分</span></div>
                    </div>
                    <div class="name-details">
                        <div class="name-meta-row">
                            <span class="name-wuxing">五行：${this.escapeHTML(elements.join('、') || '待考')}</span>
                            <span class="name-sancai">三才：${this.escapeHTML(sanCai.jiXiong || '待考')}</span>
                        </div>
                        <div class="name-wuge">五格：天${this.escapeHTML(wuGe.tianGe)} 人${this.escapeHTML(wuGe.renGe)} 地${this.escapeHTML(wuGe.diGe)} 外${this.escapeHTML(wuGe.waiGe)} 总${this.escapeHTML(wuGe.zongGe)}</div>
                        <div class="name-source"><strong>出处：</strong>${this.escapeHTML(source.work || '待考')}${source.section ? ` · ${this.escapeHTML(source.section)}` : ''}</div>
                        <blockquote class="name-quote">“${this.escapeHTML(source.quote || '暂无已核验引文')}”</blockquote>
                        <div class="name-character-details"><strong>用字：</strong>${(suggestion.characterDetails || []).map((detail) => `${this.escapeHTML(detail.char)}${detail.traditionalForm && detail.traditionalForm !== detail.char ? `→${this.escapeHTML(detail.traditionalForm)}` : ''}（${this.escapeHTML(detail.element || '未分类')}·${this.escapeHTML(detail.strokes || '?')}画）`).join('、')}</div>
                    </div>
                </article>
            `;
        }).join('');
    }

    parseAINamingTop5Response(content, candidatePool = []) {
        if (typeof content !== 'string' || !content.trim()) return null;
        const candidateMap = new Map(candidatePool.map((item) => [String(item.fullName || '').trim(), item]));
        const fencedBlocks = [...content.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)]
            .map((match) => match[1].trim())
            .filter(Boolean)
            .reverse();
        const cleanText = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';

        for (const candidate of [...fencedBlocks, content.trim()]) {
            let parsed;
            try {
                parsed = JSON.parse(candidate);
            } catch (error) {
                continue;
            }
            if (!parsed || !Array.isArray(parsed.topNames)) continue;

            const seen = new Set();
            const topNames = parsed.topNames
                .map((item) => {
                    if (!item || typeof item !== 'object') return null;
                    const fullName = cleanText(item.fullName || item.name, 20);
                    const source = candidateMap.get(fullName);
                    if (!source || seen.has(fullName)) return null;
                    const score = Number(item.score);
                    if (!Number.isFinite(score) || score < 0 || score > 100) return null;
                    seen.add(fullName);
                    return {
                        ...source,
                        rank: seen.size,
                        aiScore: Math.round(score),
                        reason: cleanText(item.reason, 400) || 'AI 已纳入多维证据完成综合排序。',
                        tradeoff: cleanText(item.tradeoff, 240)
                    };
                })
                .filter(Boolean)
                .slice(0, 5);

            const expectedCount = Math.min(5, candidateMap.size);
            if (!expectedCount || topNames.length !== expectedCount) continue;
            return { topNames, summary: cleanText(parsed.summary, 300) };
        }
        return null;
    }

    stripAINamingRankingJSON(content) {
        return String(content || '').replace(/```(?:json)?\s*([\s\S]*?)```/gi, (block, body) => {
            return /"topNames"\s*:/.test(body) ? '' : block;
        }).trim();
    }

    renderAINamingTop5Cards(topNames) {
        return topNames.map((item, index) => {
            const source = item.source || {};
            const elements = (item.wuXingMatch || []).filter(Boolean);
            const sourceTitle = `${source.work || '待考'}${source.section ? ` · ${source.section}` : ''}${source.author ? ` · ${source.author}` : ''}`;
            const characterSources = Array.from(item.firstName || '').map((char) => `
                <li><strong>${this.escapeHTML(char)}</strong>：取自 ${this.escapeHTML(sourceTitle)}，见“${this.escapeHTML(source.quote || '暂无已核验引文')}”</li>
            `).join('');
            return `
                <article class="name-card ai-top5-card">
                    <div class="name-card-topline">
                        <div class="name-rank">${index + 1}</div>
                        <span class="ai-rank-label">AI 第 ${index + 1} 名</span>
                    </div>
                    <div class="name-card-identity">
                        <div class="name-text">${this.escapeHTML(item.fullName)}</div>
                        <div class="name-score"><strong>${this.escapeHTML(item.aiScore)}</strong><span>分</span></div>
                    </div>
                    <div class="ai-name-reason"><strong>推荐理由</strong><p>${this.escapeHTML(item.reason)}</p></div>
                    ${item.tradeoff ? `<div class="ai-name-tradeoff"><strong>需要权衡</strong><p>${this.escapeHTML(item.tradeoff)}</p></div>` : ''}
                    <div class="name-details">
                        <div class="name-meta-row"><span>五行：${this.escapeHTML(elements.join('、') || '待考')}</span><span>三才：${this.escapeHTML(item.sanCai?.jiXiong || '待考')}</span></div>
                        <div class="name-source"><strong>出处：</strong>${this.escapeHTML(sourceTitle)}</div>
                        <blockquote class="name-quote">“${this.escapeHTML(source.quote || '暂无已核验引文')}”</blockquote>
                        <div class="name-character-sources"><strong>逐字取字依据：</strong><ul>${characterSources}</ul></div>
                    </div>
                </article>
            `;
        }).join('');
    }

    applyAINamingTop5(content, candidatePool = []) {
        const parsed = this.parseAINamingTop5Response(content, candidatePool);
        const empty = document.getElementById('ai-naming-top5-empty');
        const grid = document.getElementById('ai-naming-top5-grid');
        const downloadButtons = ['download-naming-pdf-btn', 'download-naming-text-btn']
            .map((id) => document.getElementById(id))
            .filter(Boolean);
        this.aiNamingTop5Result = parsed;
        if (!parsed) {
            if (empty) empty.textContent = 'AI 已完成分析，但未返回可校验的前 5 排名；详细分析仍保留在下方。';
            if (grid) grid.innerHTML = '';
            downloadButtons.forEach((button) => {
                button.disabled = true;
                button.setAttribute('aria-disabled', 'true');
            });
            return null;
        }
        if (empty) {
            empty.textContent = parsed.summary || 'AI 已完成多维比较，以下为综合排名前 5。';
            empty.classList.add('is-complete');
        }
        if (grid) grid.innerHTML = this.renderAINamingTop5Cards(parsed.topNames);
        downloadButtons.forEach((button) => {
            button.disabled = false;
            button.removeAttribute('aria-disabled');
        });
        return parsed;
    }

    getAINamingTop5ForReport() {
        return this.aiNamingTop5Result?.topNames || [];
    }

    getNamingCharacterSourceLines(suggestion) {
        const source = suggestion?.source || {};
        const sourceTitle = `${source.work || '待考'}${source.section ? ` · ${source.section}` : ''}${source.author ? ` · ${source.author}` : ''}`;
        return Array.from(suggestion?.firstName || '').map((char) => ({
            char,
            sourceTitle,
            quote: source.quote || '暂无已核验引文'
        }));
    }

    bindNamingExplorer(nameSuggestions) {
        const grid = document.getElementById('names-grid');
        const elementFilter = document.getElementById('name-element-filter');
        const sortSelect = document.getElementById('name-sort');
        const favoriteOnlyButton = document.getElementById('favorite-names-only');
        const resultCount = document.getElementById('name-result-count');
        const shortlist = document.getElementById('name-shortlist');
        const regenerateButton = document.getElementById('regenerate-names-btn');
        if (!grid || !elementFilter || !sortSelect || !favoriteOnlyButton || !shortlist) return;

        const state = { element: '', sort: 'default', favoriteOnly: false };

        const renderShortlist = () => {
            const favorites = this.loadNameFavorites();
            const count = document.getElementById('name-shortlist-count');
            const items = shortlist.querySelector('.name-shortlist-items');
            if (count) count.textContent = `${favorites.length} 个`;
            if (items) {
                items.innerHTML = favorites.length
                    ? favorites.map((name) => `<button type="button" data-remove-favorite="${this.escapeHTML(name)}" title="从备选中移除">${this.escapeHTML(name)} <span aria-hidden="true">×</span></button>`).join('')
                    : '<p>点击名字卡片上的“收藏”，在这里集中比较。</p>';
            }
        };

        const render = () => {
            const favorites = new Set(this.loadNameFavorites());
            let visible = nameSuggestions.filter((suggestion) => {
                const matchesElement = !state.element || (suggestion.wuXingMatch || []).includes(state.element);
                const matchesFavorite = !state.favoriteOnly || favorites.has(suggestion.fullName);
                return matchesElement && matchesFavorite;
            });

            if (state.sort === 'score-desc') visible = [...visible].sort((a, b) => b.score - a.score);
            if (state.sort === 'score-asc') visible = [...visible].sort((a, b) => a.score - b.score);

            grid.innerHTML = this.renderNameSuggestionCards(visible);
            if (resultCount) resultCount.textContent = `显示 ${visible.length} / ${nameSuggestions.length} 个`;
            favoriteOnlyButton.setAttribute('aria-pressed', String(state.favoriteOnly));
            favoriteOnlyButton.textContent = state.favoriteOnly ? '显示全部' : '只看收藏';
            renderShortlist();
        };

        const toggleFavorite = (name) => {
            const favorites = this.loadNameFavorites();
            const next = favorites.includes(name)
                ? favorites.filter((favorite) => favorite !== name)
                : [...favorites, name];
            this.saveNameFavorites(next);
            render();
        };

        elementFilter.addEventListener('change', () => {
            state.element = elementFilter.value;
            render();
        });
        sortSelect.addEventListener('change', () => {
            state.sort = sortSelect.value;
            render();
        });
        favoriteOnlyButton.addEventListener('click', () => {
            state.favoriteOnly = !state.favoriteOnly;
            render();
        });
        grid.addEventListener('click', (event) => {
            const button = event.target.closest('[data-favorite-name]');
            if (button) toggleFavorite(button.dataset.favoriteName);
        });
        shortlist.addEventListener('click', (event) => {
            const button = event.target.closest('[data-remove-favorite]');
            if (button) toggleFavorite(button.dataset.removeFavorite);
        });
        regenerateButton?.addEventListener('click', () => {
            const form = document.getElementById('qiming-form');
            this.formAssistant?.showFeedback(form, '正在按当前条件生成新一批名字…', 'info');
            form?.requestSubmit();
        });

        render();
    }

    // 生成自定义配置显示
    generateCustomConfigDisplay(customConfig) {
        const { firstChar, secondChar, candidateChars = [] } = customConfig;

        if (!firstChar && !secondChar && candidateChars.length === 0) {
            return '';
        }

        let html = '<div class="custom-config-display">';

        if (firstChar) {
            html += `
                <div class="config-item">
                    <span class="config-label">指定第一个字（辈分字）：</span>
                    <span class="config-value">${this.escapeHTML(firstChar)}</span>
                </div>
            `;
        }

        if (secondChar) {
            html += `
                <div class="config-item">
                    <span class="config-label">指定第二个字：</span>
                    <span class="config-value">${this.escapeHTML(secondChar)}</span>
                </div>
            `;
        }

        if (candidateChars.length > 0) {
            html += `
                <div class="config-item">
                    <span class="config-label">候选字库：</span>
                    <span class="config-value">${candidateChars.map((char) => this.escapeHTML(char)).join('、')}</span>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    // 获取柱子的五行信息
    getPillarWuXing(pillar) {
        if (!pillar || pillar.length !== 2) return '';

        const tianGan = pillar[0];
        const diZhi = pillar[1];

        const tianGanWuXing = {
            '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
            '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
        };

        const diZhiWuXing = {
            '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
            '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金',
            '戌': '土', '亥': '水'
        };

        const tianGanWX = tianGanWuXing[tianGan] || '';
        const diZhiWX = diZhiWuXing[diZhi] || '';

        return `${tianGanWX}${diZhiWX}`;
    }

    // 生成五行统计信息
    generateWuXingStats(baziResult) {
        const wuxingCount = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };

        // 统计八字中各五行的数量
        const pillars = [baziResult.yearPillar, baziResult.monthPillar, baziResult.dayPillar, baziResult.hourPillar];
        pillars.forEach(pillar => {
            if (pillar && pillar.length === 2) {
                const tianGan = pillar[0];
                const diZhi = pillar[1];

                const tianGanWuXing = {
                    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
                    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
                };

                const diZhiWuXing = {
                    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
                    '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金',
                    '戌': '土', '亥': '水'
                };

                const tianGanWX = tianGanWuXing[tianGan];
                const diZhiWX = diZhiWuXing[diZhi];

                if (tianGanWX) wuxingCount[tianGanWX]++;
                if (diZhiWX) wuxingCount[diZhiWX]++;
            }
        });

        // 生成统计显示
        let html = '';
        Object.entries(wuxingCount).forEach(([wuxing, count]) => {
            const percentage = (count / 8 * 100).toFixed(0);
            html += `
                <div class="wuxing-item">
                    <span class="wuxing-name">${wuxing}</span>
                    <div class="wuxing-bar">
                        <div class="wuxing-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="wuxing-count">${count}</span>
                </div>
            `;
        });

        return html;
    }

    // 绑定AI起名分析相关事件
    bindAINamingEvents(birthData, baziResult, nameSuggestions, aiPrompt) {
        // AI分析现在自动开始，无需手动按钮
        const copyBtn = document.getElementById('copy-ai-naming-result');

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyAINamingResult();
            });
        }
    }

    // 生成AI起名分析
    async generateAINamingAnalysis(birthData, baziResult, nameSuggestions, aiPrompt, generationId = this.namingAnalysisGeneration) {
        if (generationId !== this.namingAnalysisGeneration) return;
        console.log('=== 开始AI起名分析 ===');
        console.log('参数检查:', {
            hasBirthData: !!birthData,
            hasBaziResult: !!baziResult,
            nameSuggestionsCount: nameSuggestions?.length || 0,
            promptLength: aiPrompt?.length || 0
        });

        // 使用全局配置
        const globalConfig = this.getGlobalConfig();
        console.log('获取全局配置:', {
            provider: globalConfig?.provider || 'unknown',
            model: globalConfig?.model || 'unknown',
            hasApiKey: Boolean(globalConfig?.apiKey)
        });

        if (!globalConfig) {
            console.error('未找到全局AI配置');
            // 显示更明显的配置提示
            this.showAINamingConfigPrompt();
            return;
        }

        const apiUrl = globalConfig.apiUrl;
        const apiKey = globalConfig.apiKey;
        const modelName = String(globalConfig.model || '').trim();

        console.log('AI配置详情:', {
            apiUrl: apiUrl ? `${apiUrl.substring(0, 30)}...` : '未设置',
            hasApiKey: !!apiKey,
            apiKeyLength: apiKey ? apiKey.length : 0,
            modelName: modelName || '未设置'
        });

        // 验证输入
        if (!apiKey) {
            console.info('AI 配置尚未完成，已跳过自动分析');
            this.showAINamingError('请输入API密钥');
            return;
        }
        if (!apiUrl) {
            console.error('API地址未设置');
            this.showAINamingError('请输入API地址');
            return;
        }

        if (generationId !== this.namingAnalysisGeneration) return;
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        this.namingAnalysisAbortController = controller;

        console.log('开始显示处理状态...');
        // 显示处理状态
        this.showAINamingProcessing(nameSuggestions?.length || 0, this.nameCalculator?.classicPhrases?.length || 0);
        this.showAIDebugInfo('显示处理状态...');

        try {
            console.log('开始调用AI API...');
            // 调用AI API
            await this.callAINamingAPI(aiPrompt, apiKey, modelName, apiUrl, generationId, controller?.signal, nameSuggestions);
            console.log('AI API调用完成');

        } catch (error) {
            if (error.name === 'AbortError' || generationId !== this.namingAnalysisGeneration) return;
            console.error('AI起名分析失败:', error);
            this.showAINamingError(error.message);
        } finally {
            if (generationId === this.namingAnalysisGeneration) {
                this.hideAINamingProcessing();
                if (this.namingAnalysisAbortController === controller) {
                    this.namingAnalysisAbortController = null;
                }
            }
        }
        console.log('=== AI起名分析结束 ===');
    }

    // 显示AI调试信息
    showAIDebugInfo(message) {
        const debugDiv = document.getElementById('ai-debug-info');
        const debugText = document.getElementById('ai-debug-text');
        if (debugDiv && debugText) {
            debugDiv.style.display = 'block';
            const timestamp = new Date().toLocaleTimeString();
            debugText.innerHTML += `<br>[${timestamp}] ${message}`;
            console.log(`[AI调试] ${message}`);
        } else {
            console.log(`[AI调试] 调试元素未找到: ${message}`);
        }
    }

    // 调用AI起名API
    async callAINamingAPI(prompt, apiKey, modelName, apiUrl, generationId = this.namingAnalysisGeneration, signal = undefined, nameSuggestions = []) {
        if (generationId !== this.namingAnalysisGeneration) return;
        const processingSteps = document.getElementById('ai-naming-processing-steps');
        const processingMessage = document.getElementById('ai-naming-processing-message');
        const aiOutput = document.getElementById('ai-naming-output');
        const aiResultSection = document.getElementById('ai-naming-result-section');
        const copyBtn = document.getElementById('copy-ai-naming-result');

        let fullResponse = '';

        try {
            // 显示连接状态
            processingSteps.innerHTML = '🔗 正在连接AI服务器...<br>';
            processingMessage.textContent = '建立连接中...';

            // 构建请求体，针对不同模型进行优化
            const requestBody = {
                model: modelName,
                messages: [
                    {
                        role: "system",
                        content: "你是精通传统姓名学与现代语言文化的分析助手。请把八字、五格、三才和五行当作可解释证据，结合字义、音形、出处核验和现实使用体验独立判断；不编造典故，不输出宿命化结论，不展示思维链，并严格遵守用户提示中的报告结构和末尾 JSON 要求。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                stream: true
            };

            // 针对不同模型设置不同参数
            if (modelName.includes('deepseek-r1')) {
                // DeepSeek-R1 推理模型的特殊配置
                requestBody.temperature = 0.3; // 降低随机性，提高推理准确性
                requestBody.max_tokens = 8000; // 增加输出长度，支持详细推理
                requestBody.reasoning_effort = "high"; // 启用高强度推理模式
            } else if (modelName.includes('deepseek')) {
                requestBody.temperature = 0.5;
                requestBody.max_tokens = 6000;
            } else if (modelName.includes('gpt')) {
                requestBody.temperature = 0.7;
                requestBody.max_tokens = 4000;
            } else {
                requestBody.temperature = 0.6;
                requestBody.max_tokens = 4000;
            }

            const response = await this.requestAIResponse(apiUrl, apiKey, requestBody, { signal });

            if (generationId !== this.namingAnalysisGeneration) {
                await response.body?.cancel?.();
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API错误 (${response.status}): ${this.getApiErrorMessage(errorData)}`);
            }

            // 显示分析状态
            processingSteps.innerHTML += '🤖 AI正在分析起名方案...<br>';
            processingMessage.textContent = '正在生成分析结果...';

            // 显示结果区域
            aiResultSection.style.display = 'block';
            aiOutput.innerHTML = '';
            console.log('AI结果区域已设置为显示');

            // 通过调试信息确认结果区域状态
            const app = this;
            setTimeout(() => {
                if (generationId !== app.namingAnalysisGeneration) return;
                const resultSection = document.getElementById('ai-naming-result-section');
                if (resultSection) {
                    app.showAIDebugInfo(`结果区域状态: ${resultSection.style.display}`);
                }
            }, 100);

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (generationId !== this.namingAnalysisGeneration) {
                    await reader.cancel();
                    return;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content || '';
                            if (content) {
                                fullResponse += content;
                                aiOutput.innerHTML = this.renderAIMarkdown(fullResponse);
                            }
                        } catch (e) {
                            // 忽略JSON解析错误
                        }
                    }
                }
            }

            if (generationId !== this.namingAnalysisGeneration) return;

            // 分析完成
            processingSteps.innerHTML += '✅ AI起名分析完成<br>';
            processingMessage.textContent = '分析完成！';
            console.log('AI分析完成，响应长度:', fullResponse.length);

            // 显示复制按钮
            if (fullResponse.trim()) {
                copyBtn.style.display = 'block';
                this.fullAINamingResponse = fullResponse;
                this.applyAINamingTop5(fullResponse, nameSuggestions);
                aiOutput.innerHTML = this.renderAIMarkdown(this.stripAINamingRankingJSON(fullResponse));

                // 强制移除滚动条
                this.removeAINamingOutputScrollbar();

                // 调试信息
                const app = this;
                app.showAIDebugInfo(`✅ AI分析完成，响应长度: ${fullResponse.length}`);

                // 确认结果区域最终状态
                setTimeout(() => {
                    if (generationId !== app.namingAnalysisGeneration) return;
                    const resultSection = document.getElementById('ai-naming-result-section');
                    const output = document.getElementById('ai-naming-output');
                    app.showAIDebugInfo(`最终状态 - 结果区域: ${resultSection?.style.display}, 输出内容: ${output?.innerHTML.length || 0}字符`);
                }, 200);
            } else {
                this.showAIDebugInfo('⚠️ AI响应为空');
            }

        } catch (error) {
            if (error.name === 'AbortError') throw error;
            throw new Error(`API通信失败: ${error.message}`);
        }
    }

    // 显示AI起名处理状态
    showAINamingProcessing(candidateCount = 0, corpusCount = 0) {
        const processingDiv = document.getElementById('ai-naming-processing');
        const resultSection = document.getElementById('ai-naming-result-section');
        const processingMessage = document.getElementById('ai-naming-processing-message');
        const processingSteps = document.getElementById('ai-naming-processing-steps');

        if (processingDiv) {
            processingDiv.style.display = 'block';
        }
        if (processingMessage) processingMessage.textContent = '正在检索典籍出处并进行 AI 综合排名，请耐心等待...';
        if (processingSteps) processingSteps.innerHTML = `① 已检索 ${corpusCount || '全部'} 条已核验经典语料<br>② 已形成 ${candidateCount || '若干'} 个合规候选，正在核验字义、出处、音形与五行<br>③ AI 正在深度比较，即将生成前 5 排名和推荐理由`;
        if (resultSection) {
            resultSection.style.display = 'none';
        }
    }

    // 隐藏AI起名处理状态
    hideAINamingProcessing() {
        const processingDiv = document.getElementById('ai-naming-processing');
        const resultSection = document.getElementById('ai-naming-result-section');

        if (processingDiv) {
            processingDiv.style.display = 'none';
        }

        // 确保结果区域显示出来
        if (resultSection) {
            resultSection.style.display = 'block';
        }
    }

    // 显示AI配置提示
    showAINamingConfigPrompt() {
        console.log('显示AI配置提示');
        const processingDiv = document.getElementById('ai-naming-processing');
        const resultSection = document.getElementById('ai-naming-result-section');
        const rankingStatus = document.getElementById('ai-naming-top5-empty');

        // 隐藏处理状态
        if (processingDiv) {
            processingDiv.style.display = 'none';
        }
        if (rankingStatus) rankingStatus.textContent = '需要先配置可用的 AI，才能生成综合排名前 5。';

        // 显示配置提示在结果区域
        if (resultSection) {
            resultSection.style.display = 'block';
            const output = document.getElementById('ai-naming-output');
            if (output) {
                output.innerHTML = `
                    <div class="config-prompt">
                        <div class="config-prompt-icon"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"></circle><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"></path></svg></div>
                        <h4>需要配置AI设置</h4>
                        <p>要使用AI智能起名分析功能，请先配置AI设置：</p>
                        <ol>
                            <li>点击右上角的 <strong>AI 配置</strong> 按钮</li>
                            <li>输入模型 ID，或先从服务商加载模型列表</li>
                            <li>输入API密钥和API地址</li>
                            <li>点击"测试连接"确认配置正确</li>
                            <li>保存配置后重新生成起名分析</li>
                        </ol>
                        <div class="config-prompt-note">
                            💡 <strong>提示</strong>：本地开发环境和线上环境的配置是独立的，需要分别设置。
                        </div>
                        <button class="cyber-button config-prompt-button" onclick="document.getElementById('config-toggle').click()">
                            立即配置 AI 设置
                        </button>
                    </div>
                `;
            }
        }
    }

    // 显示AI起名错误信息
    showAINamingError(message) {
        console.log('显示AI起名错误:', message);
        const errorMessage = document.getElementById('ai-naming-error-message');
        const rankingStatus = document.getElementById('ai-naming-top5-empty');
        if (rankingStatus) rankingStatus.textContent = `AI 排名未完成：${message}`;
        if (errorMessage) {
            errorMessage.textContent = `❌ ${message}`;
            errorMessage.style.display = 'block';
            console.log('错误信息已显示在页面上');

            // 5秒后自动隐藏错误信息
            setTimeout(() => {
                errorMessage.style.display = 'none';
                console.log('错误信息已自动隐藏');
            }, 5000);
        } else {
            console.error('未找到错误消息元素');
            // 作为备选方案，显示alert
            alert(`AI起名分析错误: ${message}`);
        }
    }

    // 复制AI起名分析结果
    copyAINamingResult() {
        if (!this.fullAINamingResponse) return;

        const textArea = document.createElement('textarea');
        textArea.value = this.fullAINamingResponse;
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            const copyBtn = document.getElementById('copy-ai-naming-result');
            const originalText = copyBtn.querySelector('span').textContent;
            copyBtn.querySelector('span').textContent = '✅ 复制成功!';
            setTimeout(() => {
                copyBtn.querySelector('span').textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('复制失败:', err);
        } finally {
            document.body.removeChild(textArea);
        }
    }

    // 强制移除AI起名输出区域的滚动条
    removeAINamingOutputScrollbar() {
        const aiOutput = document.getElementById('ai-naming-output');
        const aiResultSection = document.getElementById('ai-naming-result-section');

        if (aiOutput) {
            aiOutput.style.maxHeight = 'none';
            aiOutput.style.height = 'auto';
            aiOutput.style.overflow = 'visible';
            aiOutput.style.overflowY = 'visible';
            aiOutput.style.overflowX = 'visible';
        }

        if (aiResultSection) {
            aiResultSection.style.maxHeight = 'none';
            aiResultSection.style.height = 'auto';
            aiResultSection.style.overflow = 'visible';
            aiResultSection.style.overflowY = 'visible';
            aiResultSection.style.overflowX = 'visible';
        }

        console.log('已强制移除AI起名输出区域的滚动条');
    }

    // 显示测名结果
    displayCemingResult(testData, nameAnalysis, baziResult) {
        const resultPanel = document.getElementById('ceming-result');
        const resultContent = resultPanel.querySelector('.result-content');

        if (!resultPanel || !resultContent) return;

        // 每次测名都清空上一次的 AI 评分，避免旧结果串入新报告。
        this.cemingAIScoreResult = null;
        this.fullCemingAIResponse = '';

        // 生成AI分析提示词
        const aiPrompt = this.generateCemingAIPrompt(testData, nameAnalysis, baziResult);

        const resultHTML = `
            <div class="result-header">
                <h3 class="result-title">姓名分析报告</h3>
                <div class="result-info">
                    <span>${testData.fullName} | ${testData.gender} | ${testData.year}年${testData.month}月${testData.day}日 ${testData.hour.toString().padStart(2, '0')}:${(testData.minute || 0).toString().padStart(2, '0')} | ${testData.birthProvince} ${testData.birthCity}</span>
                </div>
            </div>

            <!-- 八字信息 -->
            <div class="bazi-info">
                <h4>生辰八字</h4>
                <div class="bazi-pillars">
                    <div class="pillar">
                        <div class="pillar-label">年柱</div>
                        <div class="pillar-chars">${baziResult.yearPillar}</div>
                        <div class="pillar-wuxing">${this.getPillarWuXing(baziResult.yearPillar)}</div>
                        <div class="pillar-god">${baziResult.yearTenGod}</div>
                    </div>
                    <div class="pillar">
                        <div class="pillar-label">月柱</div>
                        <div class="pillar-chars">${baziResult.monthPillar}</div>
                        <div class="pillar-wuxing">${this.getPillarWuXing(baziResult.monthPillar)}</div>
                        <div class="pillar-god">${baziResult.monthTenGod}</div>
                    </div>
                    <div class="pillar">
                        <div class="pillar-label">日柱</div>
                        <div class="pillar-chars">${baziResult.dayPillar}</div>
                        <div class="pillar-wuxing">${this.getPillarWuXing(baziResult.dayPillar)}</div>
                        <div class="pillar-god">日主${baziResult.dayTianGan}</div>
                    </div>
                    <div class="pillar">
                        <div class="pillar-label">时柱</div>
                        <div class="pillar-chars">${baziResult.hourPillar}</div>
                        <div class="pillar-wuxing">${this.getPillarWuXing(baziResult.hourPillar)}</div>
                        <div class="pillar-god">${baziResult.hourTenGod}</div>
                    </div>
                </div>
            </div>

            <!-- 五行分析 -->
            <div class="wuxing-analysis">
                <h4>五行分析</h4>
                <div class="wuxing-stats">
                    ${this.generateWuXingStats(baziResult)}
                </div>
            </div>

            <div class="name-analysis">
                <div class="score-display">
                    <div class="score-circle">
                        <span class="score-number" id="ceming-ai-score-number">--</span>
                        <span class="score-label">AI综合分</span>
                    </div>
                    <p id="ceming-ai-score-status" class="score-status">等待大模型完成多维分析</p>
                    <p class="score-reference-note">五格、三才、康熙笔画与五行等本地规则仅作为分析证据，不是最终评分。</p>
                    <p id="ceming-ai-score-summary" class="score-summary"></p>
                    <div id="ceming-ai-score-dimensions" class="score-dimensions"></div>
                </div>

                <div class="analysis-details">
                    <div class="detail-section">
                        <h4>五格数理</h4>
                        <div class="wuge-grid">
                            <div class="wuge-item">
                                <span class="wuge-label">天格</span>
                                <span class="wuge-value">${nameAnalysis.wuGe.tianGe}</span>
                            </div>
                            <div class="wuge-item">
                                <span class="wuge-label">人格</span>
                                <span class="wuge-value">${nameAnalysis.wuGe.renGe}</span>
                            </div>
                            <div class="wuge-item">
                                <span class="wuge-label">地格</span>
                                <span class="wuge-value">${nameAnalysis.wuGe.diGe}</span>
                            </div>
                            <div class="wuge-item">
                                <span class="wuge-label">外格</span>
                                <span class="wuge-value">${nameAnalysis.wuGe.waiGe}</span>
                            </div>
                            <div class="wuge-item">
                                <span class="wuge-label">总格</span>
                                <span class="wuge-value">${nameAnalysis.wuGe.zongGe}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>三才配置</h4>
                        <p>${nameAnalysis.sanCai.tianWuXing}${nameAnalysis.sanCai.renWuXing}${nameAnalysis.sanCai.diWuXing} (${nameAnalysis.sanCai.jiXiong})</p>
                    </div>

                    <div class="detail-section">
                        <h4>康熙笔画与五行</h4>
                        <p>${(nameAnalysis.characterDetails || []).map((detail) => `${detail.char}${detail.traditionalForm && detail.traditionalForm !== detail.char ? `→${detail.traditionalForm}` : ''}：${detail.strokes || '?'}画 · ${detail.element || '未分类'}`).join('；')}</p>
                        <small>笔画取康熙字形数据；五行为姓名学整理，并非《康熙字典》原始字段。</small>
                        ${nameAnalysis.unclassifiedChars?.length ? `<p class="classification-warning">未分类字：${nameAnalysis.unclassifiedChars.join('、')}，系统不会按笔画余数猜测五行。</p>` : ''}
                        ${nameAnalysis.source ? `<p class="name-source"><strong>出处：</strong>${nameAnalysis.source.work}${nameAnalysis.source.section ? ` · ${nameAnalysis.source.section}` : ''}</p><p class="name-quote">“${nameAnalysis.source.quote}”</p>` : '<p class="classification-warning">名字组合暂无已核验的连续经典引文，请结合原典语境人工复核。</p>'}
                    </div>

                    <div class="detail-section">
                        <h4>基础分析</h4>
                        <pre class="analysis-text">${nameAnalysis.analysis}</pre>
                    </div>
                </div>
            </div>

            <!-- AI深度分析区域 -->
            <div class="ai-naming-analysis">
                <div class="ai-naming-header">
                    <h4>AI深度测名分析</h4>
                    <p>基于八字命理、五格数理、字义内涵、音韵美学等多维度的专业分析</p>
                    <p class="model-selection-note">AI 分析将使用全局配置中当前填写的模型；模型名称由服务商接口或你手动输入决定。</p>
                </div>



                <!-- AI分析自动开始，无需手动按钮 -->

                <!-- 处理状态显示 -->
                <div class="processing-box" id="ceming-ai-processing" style="display: none;">
                    <div class="processing-message" id="ceming-processing-message">正在初始化AI分析...</div>
                    <div class="processing-steps" id="ceming-processing-steps"></div>
                </div>

                <!-- AI分析结果 -->
                <div class="ai-result-section" id="ceming-ai-result-section" style="display: none;">
                    <h5>AI深度分析结果：</h5>
                    <div class="ai-output" id="ceming-ai-output"></div>
                    <div class="result-actions">
                        <button class="cyber-button" id="copy-ceming-ai-result" style="display: none;">
                            <span>复制分析结果</span>
                            <div class="button-glow"></div>
                        </button>
                    </div>
                </div>

                <!-- 错误信息显示 -->
                <div class="api-error-message" id="ceming-ai-error-message" style="display: none;"></div>

                <!-- 提示词已隐藏，保护商业机密 -->
            </div>

            <!-- PDF报告下载 -->
            <div class="result-actions">
                <div class="download-options">
                    <button class="cyber-button" id="download-ceming-pdf-btn">
                        <span>生成 PDF 报告</span>
                        <div class="button-glow"></div>
                    </button>
                    <button class="cyber-button secondary" id="download-ceming-text-btn">
                        <span>下载文本报告</span>
                        <div class="button-glow"></div>
                    </button>
                </div>
                <div class="download-note">
                    <small>提示：PDF 报告将在新窗口中打开，您可以使用浏览器的"打印"功能保存为 PDF</small>
                </div>
            </div>
        `;

        resultContent.innerHTML = resultHTML;

        // 绑定AI分析事件
        this.bindCemingAIEvents(testData, nameAnalysis, baziResult, aiPrompt);

        // 绑定模型切换事件
        this.bindCemingModelSwitchEvents();

        // 绑定PDF下载事件
        this.bindCemingDownloadEvents(testData, nameAnalysis, baziResult);

        resultPanel.style.display = 'block';
        resultPanel.classList.add('show');
        resultPanel.closest('.content-container')?.classList.add('has-result');
        resultPanel.scrollIntoView({ behavior: 'smooth' });

        // 自动开始AI测名分析
        setTimeout(() => {
            console.log('自动开始测名AI分析...');
            this.generateCemingAIAnalysis(testData, nameAnalysis, baziResult, aiPrompt);
        }, 1000); // 延迟1秒，确保界面渲染完成
    }

    // 生成测名AI分析提示词
    generateCemingAIPrompt(testData, nameAnalysis, baziResult) {
        const { fullName, gender, year, month, day, hour, minute, birthProvince, birthCity } = testData;
        const { yearPillar, monthPillar, dayPillar, hourPillar, yearTenGod, monthTenGod, hourTenGod, dayTianGan } = baziResult;

        let prompt = "";

        // 系统角色定义
        prompt += `你是一位精通中国传统姓名学和现代起名理论的专家，擅长结合八字命理、五格数理、三才配置、字义内涵、音韵美学等多个维度进行综合姓名分析。\n\n`;

        prompt += `你具备深厚的古典文学功底，熟悉《诗经》、《楚辞》、《论语》、《孟子》、《唐诗三百首》、《宋词》、《元曲》等经典文献，能够准确分析汉字的本义、引申义、文化内涵和诗词出处。你善于从古典诗词中寻找美好的字词寓意，为姓名分析提供深厚的文化底蕴。\n\n`;

        prompt += `请运用你的推理能力，逐步分析姓名的各个维度。特别是在分析字义内涵时，请深入挖掘每个字的文化内涵和诗词典故，尽可能找出其在古典诗词中的具体出处和美好寓意。\n\n`;

        prompt += `**重要要求**：\n`;
        prompt += `1. 请深入分析姓名与八字的匹配程度\n`;
        prompt += `2. 基于八字命理需求，评估姓名的优缺点\n`;
        prompt += `3. 如果发现姓名有不足之处，请提出具体的改进建议\n`;
        prompt += `4. 对姓名的字义、音韵、文化内涵进行详细分析\n`;
        prompt += `5. 提供实用的人生建议和注意事项\n\n`;

        // 基本信息
        prompt += `求名者基本信息：\n`;
        prompt += `姓名：${fullName}\n`;
        prompt += `性别：${gender}\n`;
        prompt += `出生时间：${year}年${month}月${day}日${hour}时${(minute || 0).toString().padStart(2, '0')}分\n`;
        prompt += `出生地区：${birthProvince || '未知'} ${birthCity || '未知'}\n\n`;

        // 八字信息
        prompt += `生辰八字：\n`;
        prompt += `年柱：${yearPillar} (${yearTenGod})\n`;
        prompt += `月柱：${monthPillar} (${monthTenGod})\n`;
        prompt += `日柱：${dayPillar} (日主：${dayTianGan})\n`;
        prompt += `时柱：${hourPillar} (${hourTenGod})\n\n`;

        // 五行分析
        const neededWuXing = this.nameCalculator.analyzeBaziWuXing(baziResult);
        prompt += `八字五行分析：\n`;
        prompt += `需要补充的五行：${neededWuXing.join('、')}\n`;
        prompt += `五行强弱分析：请根据八字分析五行的旺衰情况\n`;
        prompt += `姓名建议：请分析当前姓名的五行属性是否与八字需求匹配，是否有助于平衡命理。\n\n`;

        // 姓名分析信息
        prompt += `姓名分析结果：\n`;
        prompt += `五格数理：天格${nameAnalysis.wuGe.tianGe}、人格${nameAnalysis.wuGe.renGe}、地格${nameAnalysis.wuGe.diGe}、外格${nameAnalysis.wuGe.waiGe}、总格${nameAnalysis.wuGe.zongGe}\n`;
        prompt += `三才配置：${nameAnalysis.sanCai.tianWuXing}${nameAnalysis.sanCai.renWuXing}${nameAnalysis.sanCai.diWuXing} (${nameAnalysis.sanCai.jiXiong})\n`;
        prompt += `本地规则参考分：${nameAnalysis.score}分（仅作参考证据，不得直接作为最终评分）\n\n`;
        prompt += `评分原则：最终综合评分必须由你完成全部维度分析后独立给出。请综合考虑命理匹配、字义文化、音形美感、社会使用体验与经典出处可信度；不得照抄本地规则参考分，也不得只围绕该分数微调。\n`;
        prompt += `评分权重：命理匹配30%、字义文化30%、音形美感25%、社会使用15%。总分应与四个维度的加权结果基本一致；五格、三才只作为命理维度中的参考证据，不得重复扣分。\n`;
        prompt += `完成详细分析后，请在全文末尾追加一个 JSON 代码块，严格使用以下结构：\n`;
        prompt += `{"score":0到100的整数,"confidence":"高/中/低","summary":"一句话总评","dimensions":{"命理匹配":0到100,"字义文化":0到100,"音形美感":0到100,"社会使用":0到100},"analysis":"主要加分项、扣分项及改进建议"}\n\n`;

        // 输出格式要求
        prompt += `请按以下四段格式输出，正文不要展示或解释 JSON：\n\n`;
        prompt += `## 姓名综合结论\n`;
        prompt += `**AI综合评分**：[分数]/100\n`;
        prompt += `**一句话结论**：[先说明是否推荐保留，以及最重要的理由]\n\n`;

        prompt += `## 关键证据\n`;
        prompt += `**命理匹配**：[八字五行与姓名五行的具体对应；五格三才只作补充]\n`;
        prompt += `**字义与出处**：\n`;
        const surname = fullName[0];
        const firstName = fullName.slice(1);
        prompt += `- ${surname}：姓氏与名字组合后的整体语义\n`;
        for (let i = 0; i < firstName.length; i++) {
            prompt += `- ${firstName[i]}：本义、文化内涵、可核验出处和原文；无法核验写“出处待考”\n`;
        }
        prompt += `**音形体验**：[声调、连读、谐音、书写与辨识度]\n\n`;

        prompt += `## 优势与权衡\n`;
        prompt += `- 主要优势：[最多3项，每项引用具体证据]\n`;
        prompt += `- 需要权衡：[最多2项，说明影响程度，避免夸大]\n\n`;

        prompt += `## 最终建议\n`;
        prompt += `**是否建议改名**：[保留/谨慎考虑/建议调整]\n`;
        prompt += `**行动建议**：[给出1至3条与读音、书写或实际使用有关的可执行建议，不输出开运、健康或人生预测]\n\n`;

        prompt += `## 测名输出质量控制（必须执行）\n`;
        prompt += `- 这是对“现有姓名”的解释性评估，不是重新计算一个机械分数。五格、三才、笔画、五行和本地参考分只能作为证据；最终分数必须在完整分析后独立判断。\n`;
        prompt += `- 先用一句话告诉读者整体结论，再分开说明命理证据、字义文化、音形美感和社会使用体验；每个维度都要引用输入中的具体信息。\n`;
        prompt += `- 字义和出处采用证据分级：已给出且可核验的出处才可引用；不确定的典故写“出处待考”，不得为了增强文采而编造原文。\n`;
        prompt += `- 不要把姓名直接等同于性格、职业、健康或人生结果，不做确定性预测；健康、财富和重大决策建议应提醒用户结合现实专业意见。\n`;
        prompt += `- 用普通人能理解的语言解释“天格、人格、地格、三才”等术语，每个术语后都补一句实际含义，避免堆砌术语或重复段落。\n`;
        prompt += `- 改进建议必须可执行，例如读音替换、使用场景复核、签名书写测试或候选字方向；没有必要改名时要明确说明，不制造焦虑。\n`;
        prompt += `- 只输出报告正文和最后的 JSON 代码块，不输出思维链、模板占位符或 JSON 之后的解释；完成后检查姓名、分数、维度名称前后一致。\n\n`;

        prompt += `请确保分析专业、详细、实用，既要体现传统姓名学的深度，也要结合现代生活的实际需求。特别要注重字义的文化内涵和诗词典故的准确引用。`;

        return prompt;
    }

    extractStructuredJSONObjects(content, requiredKey) {
        const text = String(content || '');
        const objects = [];
        for (let start = text.length - 1; start >= 0; start -= 1) {
            if (text[start] !== '{') continue;
            let depth = 0;
            let inString = false;
            let escaped = false;
            for (let index = start; index < text.length; index += 1) {
                const char = text[index];
                if (inString) {
                    if (escaped) escaped = false;
                    else if (char === '\\') escaped = true;
                    else if (char === '"') inString = false;
                    continue;
                }
                if (char === '"') inString = true;
                else if (char === '{') depth += 1;
                else if (char === '}') {
                    depth -= 1;
                    if (depth === 0) {
                        const candidate = text.slice(start, index + 1);
                        if (!requiredKey || candidate.includes(`"${requiredKey}"`)) objects.push(candidate);
                        break;
                    }
                }
            }
        }
        return [...new Set(objects)];
    }

    stripCemingScoringJSON(content) {
        let display = String(content || '');
        display = display.replace(/```(?:json)?\s*([\s\S]*?)```/gi, (block, body) => {
            return /"score"\s*:/.test(body) && /"dimensions"\s*:/.test(body) ? '' : block;
        });
        this.extractStructuredJSONObjects(display, 'score').forEach((candidate) => {
            try {
                const parsed = JSON.parse(candidate);
                if (Number.isInteger(parsed.score) && parsed.dimensions && typeof parsed.dimensions === 'object') {
                    display = display.replace(candidate, '');
                }
            } catch (error) {
                // Keep non-JSON braces in the readable report.
            }
        });
        return display
            .replace(/^\s*`?json\s*`?\s*$/gim, '')
            .replace(/^\s*`\s*$/gm, '')
            .replace(/^\s*--\s*$/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    // 解析大模型在报告末尾返回的结构化综合评分
    parseCemingAIResponse(content) {
        if (typeof content !== 'string' || !content.trim()) return null;

        const fencedBlocks = [...content.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)]
            .map((match) => match[1].trim())
            .filter(Boolean)
            .reverse();
        const balancedObjects = this.extractStructuredJSONObjects(content, 'score');
        const candidates = [...fencedBlocks, ...balancedObjects, content.trim()];

        const cleanText = (value, maxLength = 1000) =>
            typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

        for (const candidate of candidates) {
            let data;
            try {
                data = JSON.parse(candidate);
            } catch (error) {
                continue;
            }

            if (!data || typeof data !== 'object' || !Number.isInteger(data.score) || data.score < 0 || data.score > 100) {
                continue;
            }

            const dimensions = {};
            if (data.dimensions && typeof data.dimensions === 'object' && !Array.isArray(data.dimensions)) {
                Object.entries(data.dimensions).forEach(([label, value]) => {
                    if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100) {
                        dimensions[String(label).trim().slice(0, 40)] = Math.round(value);
                    }
                });
            }

            return {
                score: data.score,
                confidence: cleanText(data.confidence, 20),
                summary: cleanText(data.summary, 300),
                dimensions,
                analysis: cleanText(data.analysis, 2000)
            };
        }

        return null;
    }

    getCemingAIScoreResult() {
        if (this.cemingAIScoreResult) return this.cemingAIScoreResult;
        const parsed = this.parseCemingAIResponse(this.fullCemingAIResponse || '');
        if (parsed) this.cemingAIScoreResult = parsed;
        return parsed;
    }

    // 只有通过结构校验的 AI 分数才能进入主评分与导出报告
    applyCemingAIScore(content) {
        const parsed = this.parseCemingAIResponse(content);
        const scoreNumber = document.getElementById('ceming-ai-score-number');
        const scoreStatus = document.getElementById('ceming-ai-score-status');
        const scoreSummary = document.getElementById('ceming-ai-score-summary');
        const scoreDimensions = document.getElementById('ceming-ai-score-dimensions');

        if (!parsed) {
            this.cemingAIScoreResult = null;
            if (scoreNumber) scoreNumber.textContent = '--';
            if (scoreStatus) scoreStatus.textContent = 'AI未返回可校验的综合评分';
            if (scoreSummary) scoreSummary.textContent = '详细分析已保留，但本次最终评分不可用。';
            if (scoreDimensions) scoreDimensions.innerHTML = '';
            return null;
        }

        this.cemingAIScoreResult = parsed;
        if (scoreNumber) scoreNumber.textContent = String(parsed.score);
        if (scoreStatus) {
            scoreStatus.textContent = `大模型已完成多维分析${parsed.confidence ? ` · 可信度：${parsed.confidence}` : ''}`;
        }
        if (scoreSummary) scoreSummary.textContent = parsed.summary || 'AI综合评分已生成';
        if (scoreDimensions) {
            const entries = Object.entries(parsed.dimensions);
            scoreDimensions.innerHTML = entries.length
                ? entries.map(([label, score]) => `<span>${this.escapeHTML(label)}：${score}</span>`).join('')
                : '';
        }

        return parsed;
    }
    // 绑定测名AI分析事件
    bindCemingAIEvents(testData, nameAnalysis, baziResult, aiPrompt) {
        // AI分析现在自动开始，无需手动按钮
        const copyBtn = document.getElementById('copy-ceming-ai-result');

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyCemingAIResult();
            });
        }
    }

    // 绑定测名模型切换事件
    bindCemingModelSwitchEvents() {
        const modelSelect = document.getElementById('ceming-model');
        const apiUrlInput = document.getElementById('ceming-api-url');

        if (modelSelect && apiUrlInput) {
            modelSelect.addEventListener('change', (e) => {
                const selectedModel = e.target.value;
                const apiUrls = {
                    'deepseek-r1': 'https://api.deepseek.com/v1/chat/completions',
                    'deepseek-chat': 'https://api.deepseek.com/v1/chat/completions',
                    'gpt-4': 'https://api.openai.com/v1/chat/completions',
                    'gpt-3.5-turbo': 'https://api.openai.com/v1/chat/completions',
                    'claude-3-sonnet': 'https://api.anthropic.com/v1/messages',
                    'claude-3-haiku': 'https://api.anthropic.com/v1/messages',
                    'qwen-max': 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                    'glm-4': 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
                };

                if (apiUrls[selectedModel]) {
                    apiUrlInput.value = apiUrls[selectedModel];
                }
            });
        }
    }

    // 生成测名AI分析
    async generateCemingAIAnalysis(testData, nameAnalysis, baziResult, aiPrompt) {
        // 使用全局配置
        const globalConfig = this.getGlobalConfig();
        if (!globalConfig) {
            this.showCemingAIError('请先在右上角配置AI设置');
            return;
        }

        const apiUrl = globalConfig.apiUrl;
        const apiKey = globalConfig.apiKey;
        const modelName = String(globalConfig.model || '').trim();

        // 验证输入
        if (!apiKey) {
            this.showCemingAIError('请输入API密钥');
            return;
        }
        if (!apiUrl) {
            this.showCemingAIError('请输入API地址');
            return;
        }
        if (!modelName) {
            this.showCemingAIError('请输入模型名称');
            return;
        }

        // 显示处理状态
        this.showCemingAIProcessing();

        try {
            // 调用AI API
            await this.callCemingAIAPI(aiPrompt, apiKey, modelName, apiUrl);

        } catch (error) {
            console.error('AI测名分析失败:', error);
            this.showCemingAIError(error.message);
        } finally {
            this.hideCemingAIProcessing();
        }
    }

    // 调用测名AI API
    async callCemingAIAPI(prompt, apiKey, modelName, apiUrl) {
        const processingSteps = document.getElementById('ceming-processing-steps');
        const processingMessage = document.getElementById('ceming-processing-message');
        const aiOutput = document.getElementById('ceming-ai-output');
        const aiResultSection = document.getElementById('ceming-ai-result-section');
        const copyBtn = document.getElementById('copy-ceming-ai-result');

        let fullResponse = '';

        try {
            // 显示连接状态
            processingSteps.innerHTML = '🔗 正在连接AI服务器...<br>';
            processingMessage.textContent = '建立连接中...';

            console.log('测名AI分析开始:', { apiUrl, modelName, promptLength: prompt.length });

            // 构建请求体，针对不同模型进行优化
            const requestBody = {
                model: modelName,
                messages: [
                    {
                        role: "system",
                        content: "你是精通传统姓名学与现代语言文化的分析助手。请把八字、五格、三才和五行当作可解释证据，结合字义、音形、出处核验和现实使用体验独立判断；不编造典故，不输出宿命化结论，不展示思维链，并严格遵守用户提示中的报告结构和末尾 JSON 要求。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                stream: true
            };

            // 针对不同模型设置不同参数
            if (modelName.includes('deepseek-r1')) {
                requestBody.temperature = 0.3;
                requestBody.max_tokens = 8000;
                requestBody.reasoning_effort = "high";
            } else if (modelName.includes('deepseek')) {
                requestBody.temperature = 0.5;
                requestBody.max_tokens = 6000;
            } else if (modelName.includes('gpt')) {
                requestBody.temperature = 0.7;
                requestBody.max_tokens = 4000;
            } else {
                requestBody.temperature = 0.6;
                requestBody.max_tokens = 4000;
            }

            const response = await this.requestAIResponse(apiUrl, apiKey, requestBody);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API响应错误:', response.status, errorData);
                throw new Error(`API错误 (${response.status}): ${this.getApiErrorMessage(errorData)}`);
            }

            console.log('API响应成功，开始处理流式数据');

            // 显示分析状态
            processingSteps.innerHTML += '🤖 AI正在分析姓名...<br>';
            processingMessage.textContent = '正在生成分析结果...';

            // 显示结果区域
            aiResultSection.style.display = 'block';
            aiOutput.innerHTML = '';

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || '';
                            if (content) {
                                fullResponse += content;
                                aiOutput.innerHTML = this.formatMarkdown(fullResponse);
                                aiOutput.scrollTop = aiOutput.scrollHeight;
                                console.log('收到内容片段:', content.length, '字符');
                            }
                        } catch (e) {
                            console.warn('解析流式数据失败:', e, '数据:', data);
                        }
                    }
                }
            }

            // 完成处理
            console.log('AI分析完成，总响应长度:', fullResponse.length);
            this.applyCemingAIScore(fullResponse);
            aiOutput.innerHTML = this.formatMarkdown(this.stripCemingScoringJSON(fullResponse));
            processingSteps.innerHTML += '✅ AI测名分析完成<br>';
            processingMessage.textContent = '分析完成！';

            // 显示复制按钮
            if (fullResponse.trim()) {
                copyBtn.style.display = 'block';
                this.fullCemingAIResponse = fullResponse;

                // 强制移除滚动条
                this.removeCemingAIOutputScrollbar();
                console.log('AI分析结果已显示');
            } else {
                console.warn('AI分析结果为空');
            }

        } catch (error) {
            console.error('流式API调用失败，尝试非流式调用:', error);

            // 尝试非流式调用作为备选方案
            try {
                const nonStreamRequestBody = { ...requestBody, stream: false };
                const nonStreamResponse = await this.requestAIResponse(apiUrl, apiKey, nonStreamRequestBody);

                if (!nonStreamResponse.ok) {
                    const errorData = await nonStreamResponse.json().catch(() => ({}));
                    throw new Error(`API错误 (${nonStreamResponse.status}): ${this.getApiErrorMessage(errorData)}`);
                }

                const result = await nonStreamResponse.json();
                const content = result.choices?.[0]?.message?.content || '';

                if (content) {
                    aiOutput.innerHTML = this.formatMarkdown(this.stripCemingScoringJSON(content));
                    this.fullCemingAIResponse = content;
                    this.applyCemingAIScore(content);
                    copyBtn.style.display = 'block';
                    this.removeCemingAIOutputScrollbar();
                    console.log('非流式API调用成功');
                } else {
                    throw new Error('AI返回内容为空');
                }
            } catch (fallbackError) {
                throw new Error(`API通信失败: ${fallbackError.message}`);
            }
        }
    }

    // 显示测名AI处理状态
    showCemingAIProcessing() {
        const processingDiv = document.getElementById('ceming-ai-processing');
        const resultSection = document.getElementById('ceming-ai-result-section');

        if (processingDiv) {
            processingDiv.style.display = 'block';
        }
        if (resultSection) {
            resultSection.style.display = 'none';
        }
    }

    // 隐藏测名AI处理状态
    hideCemingAIProcessing() {
        const processingDiv = document.getElementById('ceming-ai-processing');
        if (processingDiv) {
            processingDiv.style.display = 'none';
        }
    }

    // 显示测名AI错误
    showCemingAIError(message) {
        const errorMessage = document.getElementById('ceming-ai-error-message');
        const scoreNumber = document.getElementById('ceming-ai-score-number');
        const scoreStatus = document.getElementById('ceming-ai-score-status');

        this.cemingAIScoreResult = null;
        if (scoreNumber) scoreNumber.textContent = '--';
        if (scoreStatus) scoreStatus.textContent = `AI综合评分未生成：${message}`;
        if (errorMessage) {
            errorMessage.textContent = `❌ ${message}`;
            errorMessage.style.display = 'block';
        }
    }

    // 复制测名AI分析结果
    copyCemingAIResult() {
        if (!this.fullCemingAIResponse) return;

        const textArea = document.createElement('textarea');
        textArea.value = this.stripCemingScoringJSON(this.fullCemingAIResponse);
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            const copyBtn = document.getElementById('copy-ceming-ai-result');
            const originalText = copyBtn.querySelector('span').textContent;
            copyBtn.querySelector('span').textContent = '✅ 复制成功!';
            setTimeout(() => {
                copyBtn.querySelector('span').textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('复制失败:', err);
        } finally {
            document.body.removeChild(textArea);
        }
    }

    // 强制移除测名AI输出区域的滚动条
    removeCemingAIOutputScrollbar() {
        const aiOutput = document.getElementById('ceming-ai-output');
        const aiResultSection = document.getElementById('ceming-ai-result-section');

        if (aiOutput) {
            aiOutput.style.maxHeight = 'none';
            aiOutput.style.height = 'auto';
            aiOutput.style.overflow = 'visible';
            aiOutput.style.overflowY = 'visible';
            aiOutput.style.overflowX = 'visible';
            aiOutput.classList.remove('scrollable');
        }

        if (aiResultSection) {
            aiResultSection.style.maxHeight = 'none';
            aiResultSection.style.height = 'auto';
            aiResultSection.style.overflow = 'visible';
            aiResultSection.style.overflowY = 'visible';
            aiResultSection.style.overflowX = 'visible';
        }

        console.log('已强制移除测名AI输出区域的滚动条');
    }

    sanitizeAIHTML(html) {
        if (window.DOMPurify?.sanitize) {
            return window.DOMPurify.sanitize(html, {
                USE_PROFILES: { html: true },
                FORBID_TAGS: ['form', 'input', 'button', 'style', 'iframe', 'object', 'embed'],
                FORBID_ATTR: ['style']
            });
        }
        return this.escapeHTML(html);
    }

    renderAIMarkdown(text) {
        if (!text) return '';
        const normalizedText = this.normalizeOraclePoem(text);
        const rawHTML = typeof marked !== 'undefined'
            ? marked.parse(normalizedText)
            : this.simpleMarkdownParse(normalizedText);
        return this.sanitizeAIHTML(rawHTML);
    }

    normalizeOraclePoem(text) {
        if (!text) return '';

        return String(text).replace(
            /\$\$\s*\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}\s*\$\$/g,
            (block, body) => {
                const verses = [];
                body.replace(/\\text\{([\s\S]*?)\}\s*([，。！？；：、]?)/g, (_match, verse, punctuation) => {
                    const cleanVerse = verse.replace(/\s+/g, '').trim();
                    if (cleanVerse) verses.push(`${cleanVerse}${punctuation || ''}`);
                    return _match;
                });

                if (verses.length < 2) return block;

                const lines = verses
                    .map((verse) => `<div class="oracle-poem-line">${this.escapeHTML(verse)}</div>`)
                    .join('\n');
                return `\n<div class="oracle-poem">\n${lines}\n</div>\n`;
            }
        );
    }

    // 格式化Markdown文本
    formatMarkdown(text) {
        if (!text) return '';

        // 简单的Markdown格式化
        let formatted = text
            // 标题格式化
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // 粗体格式化
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // 斜体格式化
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // 代码格式化
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // 换行处理
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        // 包装在段落标签中
        if (formatted && !formatted.startsWith('<h') && !formatted.startsWith('<p>')) {
            formatted = '<p>' + formatted + '</p>';
        }

        return this.sanitizeAIHTML(formatted);
    }

    // 显示合婚结果
    displayHehunResult(marriageData, marriageResult) {
        const resultPanel = document.getElementById('hehun-result');
        const resultContent = resultPanel.querySelector('.result-content');

        if (!resultPanel || !resultContent) return;

        // 每次合婚都清空上一次的 AI 结论，避免旧结果串入新报告。
        this.marriageAIScoreResult = null;
        this.fullMarriageAIResponse = '';

        // 生成AI分析提示词
        const aiPrompt = this.generateMarriageAIPrompt(marriageData, marriageResult);

        const resultHTML = `
            <div class="result-header">
                <h3 class="result-title">合婚分析报告</h3>
                <div class="result-info">
                    <span>${marriageData.male.name} ♥ ${marriageData.female.name}</span>
                </div>
            </div>

            <div class="marriage-analysis">
                <div class="match-score">
                    <div class="score-circle large">
                        <span class="score-number" id="marriage-ai-score-number">--</span>
                        <span class="score-label">AI综合分</span>
                    </div>
                    <p id="marriage-ai-score-status" class="score-status">等待大模型完成综合判断</p>
                    <p class="score-reference-note">生肖、五行、十神和年龄等本地规则仅作为分析证据，不是最终结论。</p>
                    <p id="marriage-ai-score-summary" class="score-summary"></p>
                    <div id="marriage-ai-score-dimensions" class="score-dimensions"></div>
                </div>

                <div class="analysis-pending-note">
                    本地八字、生肖、五行和年龄规则已作为 AI 推理证据；最终结论将在大模型完成综合判断后显示。
                </div>

                <!-- AI深度分析区域 -->
                <div class="ai-analysis-section">
                    <h4>AI综合合婚判断</h4>
                    <p class="ai-description">大模型将综合本地规则证据、双方命盘信息和现实相处维度后给出最终判断。</p>

                    <!-- AI分析自动开始，无需手动按钮 -->

                    <!-- AI分析处理状态 -->
                    <div class="ai-marriage-processing" id="ai-marriage-processing" style="display: none;">
                        <div class="processing-animation">
                            <div class="cyber-loader"></div>
                        </div>
                        <div class="processing-info">
                            <div class="processing-message" id="ai-marriage-processing-message">正在准备AI分析...</div>
                            <div class="processing-steps" id="ai-marriage-processing-steps"></div>
                        </div>
                    </div>

                    <!-- AI分析结果 -->
                    <div class="ai-marriage-result-section" id="ai-marriage-result-section" style="display: none;">
                        <h5>AI深度分析结果：</h5>
                        <div class="ai-marriage-output" id="ai-marriage-output"></div>
                        <div class="result-actions">
                            <button class="cyber-button" id="copy-ai-marriage-result" style="display: none;">
                                <span>复制分析结果</span>
                                <div class="button-glow"></div>
                            </button>
                        </div>
                    </div>

                    <!-- 提示词已隐藏，保护商业机密 -->
                </div>

                <!-- PDF报告下载 -->
                <div class="result-actions">
                    <div class="download-options">
                        <button class="cyber-button" id="download-marriage-pdf-btn">
                            <span>生成 PDF 报告</span>
                            <div class="button-glow"></div>
                        </button>
                        <button class="cyber-button secondary" id="download-marriage-text-btn">
                            <span>下载文本报告</span>
                            <div class="button-glow"></div>
                        </button>
                    </div>
                    <div class="download-note">
                        <small>提示：PDF 报告将在新窗口中打开，您可以使用浏览器的"打印"功能保存为 PDF</small>
                    </div>
                </div>
            </div>
        `;

        resultContent.innerHTML = resultHTML;

        // 绑定AI合婚分析事件
        this.bindMarriageAIEvents(marriageData, marriageResult, aiPrompt);

        // 绑定PDF下载事件
        this.bindMarriageDownloadEvents(marriageData, marriageResult);

        // 显示结果面板
        resultPanel.style.display = 'block';
        resultPanel.classList.add('show');
        resultPanel.closest('.content-container')?.classList.add('has-result');
        resultPanel.scrollIntoView({ behavior: 'smooth' });

        // 自动开始AI合婚分析
        setTimeout(() => {
            console.log('自动开始合婚AI分析...');
            this.generateMarriageAIAnalysis(marriageData, marriageResult, aiPrompt);
        }, 1000); // 延迟1秒，确保界面渲染完成
    }

    // 调用AI API
    async callAIAPI(prompt, apiKey, modelName, apiUrl) {
        const processingSteps = document.getElementById('ai-processing-steps');
        const processingMessage = document.getElementById('ai-processing-message');
        const aiOutput = document.getElementById('ai-output');
        const aiResultSection = document.getElementById('ai-result-section');
        const copyBtn = document.getElementById('copy-ai-result');

        let fullResponse = '';

        try {
            // 显示连接状态
            processingSteps.innerHTML = '🔗 正在连接AI服务器...<br>';
            processingMessage.textContent = '建立连接中...';

            console.log('API调用开始:', { apiUrl, modelName, environment: 'cloudflare-pages' });

            const requestBody = {
                model: modelName,
                messages: [
                    {
                        role: "system",
                        content: "你是精通中国传统命理学的AI助手，擅长八字命理和紫薇斗数分析。请用专业术语进行详细分析，并提供实用的人生建议。"
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                stream: true,
                temperature: 0.7,
                max_tokens: 4000
            };

            console.log('发送请求体:', JSON.stringify(requestBody, null, 2));

            const response = await this.requestAIResponse(apiUrl, apiKey, requestBody);

            console.log('API响应状态:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text().catch(() => '无法读取错误信息');
                console.error('API错误详情:', errorText);

                let errorData = {};
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    console.error('无法解析错误JSON:', e);
                }

                throw new Error(`API错误 (${response.status}): ${this.getApiErrorMessage(errorData, errorText || '未知错误')}`);
            }

            // 显示分析状态
            processingSteps.innerHTML += '🤖 AI正在分析命盘...<br>';
            processingMessage.textContent = '正在生成分析结果...';

            // 显示结果区域
            aiResultSection.style.display = 'block';
            aiOutput.innerHTML = '';

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content || '';
                            if (content) {
                                fullResponse += content;
                                aiOutput.innerHTML = this.renderAIMarkdown(fullResponse);
                            }
                        } catch (e) {
                            // 忽略JSON解析错误
                        }
                    }
                }
            }

            // 分析完成
            processingSteps.innerHTML += '✅ AI分析完成<br>';
            processingMessage.textContent = '分析完成！';

            // 显示复制按钮
            if (fullResponse.trim()) {
                copyBtn.style.display = 'block';
                this.fullAIResponse = fullResponse;

                // 强制移除AI输出区域的滚动条
                this.removeAIOutputScrollbar();
            }

        } catch (error) {
            console.error('API调用失败:', error);

            // 检查是否是网络或CORS错误
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('网络连接失败，可能的原因：\n1. 网络连接问题\n2. API地址不正确\n3. CORS跨域限制\n4. 防火墙或代理阻止\n\n请检查网络连接和API配置。');
            }

            // 检查是否是API密钥错误
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                throw new Error('API密钥验证失败，请检查：\n1. API密钥是否正确\n2. API密钥是否有效\n3. 是否有足够的API配额');
            }

            // 检查是否是模型不存在错误
            if (error.message.includes('404') || error.message.includes('model')) {
                throw new Error('模型不存在或不可用，请检查：\n1. 模型名称是否正确\n2. 该模型是否在您的API账户中可用\n3. 尝试切换到其他模型');
            }

            throw new Error(`API通信失败: ${error.message}`);
        }
    }

    // 强制移除AI输出区域的滚动条
    removeAIOutputScrollbar() {
        const aiOutput = document.getElementById('ai-output');
        const aiResultSection = document.getElementById('ai-result-section');

        if (aiOutput) {
            // 强制设置样式移除滚动条
            aiOutput.style.maxHeight = 'none';
            aiOutput.style.height = 'auto';
            aiOutput.style.overflow = 'visible';
            aiOutput.style.overflowY = 'visible';
            aiOutput.style.overflowX = 'visible';

            // 移除可能的CSS类
            aiOutput.classList.remove('scrollable');
        }

        if (aiResultSection) {
            aiResultSection.style.maxHeight = 'none';
            aiResultSection.style.height = 'auto';
            aiResultSection.style.overflow = 'visible';
            aiResultSection.style.overflowY = 'visible';
            aiResultSection.style.overflowX = 'visible';
        }

        console.log('已强制移除AI输出区域的滚动条');
    }

    // 显示成功信息
    showSuccess(message) {
        // 创建临时提示
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a1f2b, #12151d);
            border: 1px solid rgba(216, 180, 106, 0.45);
            color: #edeae0;
            padding: 1rem 1.6rem;
            border-radius: 4px;
            z-index: 10000;
            animation: slideInFromRight 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideInFromRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // 显示错误信息
    showError(message) {
        // 创建临时提示
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a1f2b, #12151d);
            border: 1px solid rgba(217, 117, 107, 0.5);
            color: #f0c5be;
            padding: 1rem 1.6rem;
            border-radius: 4px;
            z-index: 10000;
            animation: slideInFromRight 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideInFromRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // 简单的Markdown解析（备用）
    simpleMarkdownParse(text) {
        const formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/### (.*?)$/gm, '<h3>$1</h3>')
            .replace(/## (.*?)$/gm, '<h2>$1</h2>')
            .replace(/# (.*?)$/gm, '<h1>$1</h1>')
            .replace(/\n/g, '<br>');
        return this.sanitizeAIHTML(formatted);
    }

    // 生成紫薇斗数提示词
    generateZiweiPrompt(ziweiResult) {
        if (!ziweiResult || !ziweiResult.palaces) return '';

        let prompt = '\n\n=== 紫薇斗数命盘信息 ===\n';
        prompt += `命宫：${ziweiResult.earthlyBranchOfSoulPalace}\n`;
        prompt += `身宫：${ziweiResult.earthlyBranchOfBodyPalace}\n`;
        if (ziweiResult.fiveElementsClass) {
            prompt += `五行局：${ziweiResult.fiveElementsClass}\n`;
        }

        prompt += '\n十二宫星曜分布：\n';
        ziweiResult.palaces.forEach(palace => {
            const majorStars = palace.majorStars && palace.majorStars.length > 0
                ? palace.majorStars.join('、') : '无主星';
            const minorStars = palace.minorStars && palace.minorStars.length > 0
                ? palace.minorStars.slice(0, 3).join('、') : '';

            prompt += `${palace.name}(${palace.earthlyBranch})：${majorStars}`;
            if (minorStars) {
                prompt += ` | ${minorStars}`;
            }
            prompt += '\n';
        });

        prompt += '\n请结合紫薇斗数命盘进行综合分析。';
        return prompt;
    }

    // 显示AI处理状态
    showAIProcessing() {
        const processingBox = document.getElementById('ai-processing-box');
        const processingSteps = document.getElementById('ai-processing-steps');
        const errorMessage = document.getElementById('ai-error-message');

        processingBox.style.display = 'block';
        processingSteps.innerHTML = '';
        errorMessage.style.display = 'none';
    }

    // 隐藏AI处理状态
    hideAIProcessing() {
        const processingBox = document.getElementById('ai-processing-box');
        processingBox.style.display = 'none';
    }

    // 显示AI错误
    showAIError(message) {
        const errorMessage = document.getElementById('ai-error-message');
        errorMessage.textContent = `❌ ${message}`;
        errorMessage.style.display = 'block';

        // 不再显示复制提示词按钮，保护商业机密
    }

    // 复制AI分析结果
    copyAIResult() {
        if (!this.fullAIResponse) return;

        const textArea = document.createElement('textarea');
        textArea.value = this.fullAIResponse;
        document.body.appendChild(textArea);
        textArea.select();

        try {
            document.execCommand('copy');
            const copyBtn = document.getElementById('copy-ai-result');
            const originalText = copyBtn.querySelector('span').textContent;
            copyBtn.querySelector('span').textContent = '✅ 复制成功!';
            setTimeout(() => {
                copyBtn.querySelector('span').textContent = originalText;
            }, 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }

        document.body.removeChild(textArea);
    }

    // 提示词切换功能已移除，保护商业机密

    // 生成用于PDF/图片的HTML报告
    generateReportHTML() {
        const resultContent = document.querySelector('#zhiming-result .result-content');
        if (!resultContent) return '';

        const title = resultContent.querySelector('.result-title')?.textContent || '';
        const info = resultContent.querySelector('.result-info')?.textContent || '';

        // 获取AI分析结果
        const aiOutput = document.getElementById('ai-output');
        const aiAnalysis = aiOutput ? aiOutput.innerHTML : '';

        return `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
                        line-height: 1.8;
                        color: #333;
                        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                        margin: 0;
                        padding: 40px;
                        min-height: 100vh;
                    }
                    .report-container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: rgba(255, 255, 255, 0.95);
                        border-radius: 15px;
                        padding: 40px;
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    }
                    .report-header {
                        text-align: center;
                        margin-bottom: 40px;
                        border-bottom: 3px solid #00d4ff;
                        padding-bottom: 20px;
                    }
                    .report-title {
                        font-size: 2.5rem;
                        font-weight: bold;
                        background: linear-gradient(45deg, #00d4ff, #ff0080);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        margin-bottom: 10px;
                    }
                    .report-subtitle {
                        font-size: 1.2rem;
                        color: #666;
                        margin-bottom: 20px;
                    }
                    .basic-info {
                        background: linear-gradient(45deg, #f8f9fa, #e9ecef);
                        padding: 20px;
                        border-radius: 10px;
                        margin-bottom: 30px;
                        border-left: 5px solid #00d4ff;
                    }
                    .section {
                        margin-bottom: 30px;
                        padding: 20px;
                        border-radius: 10px;
                        background: #f8f9fa;
                    }
                    .section-title {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #00d4ff;
                        margin-bottom: 15px;
                        border-bottom: 2px solid #00d4ff;
                        padding-bottom: 5px;
                    }
                    .bazi-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .pillar-card {
                        background: white;
                        border: 2px solid #00d4ff;
                        border-radius: 8px;
                        padding: 15px;
                        text-align: center;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }
                    .pillar-name {
                        font-weight: bold;
                        color: #ff0080;
                        margin-bottom: 8px;
                    }
                    .pillar-chars {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #333;
                        margin-bottom: 5px;
                    }
                    .pillar-god {
                        color: #666;
                        font-size: 0.9rem;
                    }
                    .ai-analysis {
                        background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
                        border: 2px solid #00d4ff;
                        border-radius: 10px;
                        padding: 25px;
                    }
                    .ai-analysis h1, .ai-analysis h2, .ai-analysis h3 {
                        color: #00d4ff;
                        margin-top: 20px;
                        margin-bottom: 10px;
                    }
                    .ai-analysis h1 {
                        font-size: 1.8rem;
                        border-bottom: 2px solid #00d4ff;
                        padding-bottom: 5px;
                    }
                    .ai-analysis h2 {
                        font-size: 1.5rem;
                    }
                    .ai-analysis h3 {
                        font-size: 1.3rem;
                    }
                    .ai-analysis strong {
                        color: #ff0080;
                    }
                    .ai-analysis em {
                        color: #00aa66;
                        font-style: italic;
                    }
                    .oracle-poem {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 8px 24px;
                        margin: 20px auto;
                        padding: 18px 22px;
                        border: 1px solid #c9a65b;
                        border-radius: 8px;
                        background: #fffaf0;
                    }
                    .oracle-poem-line {
                        min-width: 0;
                        text-align: center;
                        font-size: 1.05rem;
                        line-height: 1.9;
                        letter-spacing: 0.08em;
                        overflow-wrap: anywhere;
                    }
                    .report-footer {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 2px solid #00d4ff;
                        color: #666;
                        font-size: 0.9rem;
                    }
                    .watermark {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        opacity: 0.3;
                        font-size: 0.8rem;
                        color: #999;
                    }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="report-header">
                        <div class="report-title">赛博论命</div>
                        <div class="report-subtitle">完整命理分析报告</div>
                    </div>

                    <div class="basic-info">
                        <strong>基本信息</strong><br>
                        ${info}
                    </div>

                    ${this.generateBaziHTML(resultContent)}
                    ${this.generateSolarTimeHTML(resultContent)}
                    ${this.generateDayunHTML(resultContent)}
                    ${this.generateZiweiHTML(resultContent)}

                    ${aiAnalysis ? `
                        <div class="section">
                            <div class="section-title">AI智能分析</div>
                            <div class="ai-analysis">
                                ${aiAnalysis}
                            </div>
                        </div>
                    ` : ''}

                    <div class="report-footer">
                        报告生成时间：${new Date().toLocaleString('zh-CN')}<br>
                        本报告由赛博论命系统生成
                    </div>
                </div>
                <div class="watermark">赛博论命 CyberFortune</div>
            </body>
            </html>
        `;
    }

    // 生成八字HTML部分
    generateBaziHTML(resultContent) {
        const pillars = resultContent.querySelectorAll('.pillar');
        if (pillars.length === 0) return '';

        const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
        let html = '<div class="section"><div class="section-title">八字命盘</div><div class="bazi-grid">';

        pillars.forEach((pillar, index) => {
            const chars = pillar.querySelector('.pillar-chars')?.textContent || '';
            const god = pillar.querySelector('.pillar-god')?.textContent || '';

            html += `
                <div class="pillar-card">
                    <div class="pillar-name">${pillarNames[index] || ''}</div>
                    <div class="pillar-chars">${chars}</div>
                    <div class="pillar-god">${god}</div>
                </div>
            `;
        });

        html += '</div></div>';
        return html;
    }

    // 生成真太阳时HTML部分
    generateSolarTimeHTML(resultContent) {
        const solarTimeSection = resultContent.querySelector('.solar-time-section');
        if (!solarTimeSection) return '';

        let html = '<div class="section"><div class="section-title">真太阳时修正</div>';

        const timeRows = solarTimeSection.querySelectorAll('.time-row');
        timeRows.forEach(row => {
            const label = row.querySelector('.time-label')?.textContent || '';
            const value = row.querySelector('.time-value')?.textContent || '';
            if (label && value) {
                html += `<p><strong>${label}</strong>${value}</p>`;
            }
        });

        html += '</div>';
        return html;
    }

    // 生成大运HTML部分
    generateDayunHTML(resultContent) {
        const dayunSection = resultContent.querySelector('.dayun-section');
        if (!dayunSection) return '';

        let html = '<div class="section"><div class="section-title">大运信息</div>';

        const dayunInfo = dayunSection.querySelector('.dayun-info p')?.textContent || '';
        if (dayunInfo) {
            html += `<p>${dayunInfo}</p>`;
        }

        const dayunPillars = dayunSection.querySelectorAll('.dayun-pillar');
        if (dayunPillars.length > 0) {
            html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 15px;">';
            dayunPillars.forEach(pillar => {
                const age = pillar.querySelector('.dayun-age')?.textContent || '';
                const chars = pillar.querySelector('.dayun-chars')?.textContent || '';
                if (age && chars) {
                    html += `
                        <div style="background: white; border: 1px solid #00d4ff; border-radius: 5px; padding: 10px; text-align: center;">
                            <div style="font-size: 0.8rem; color: #666;">${age}</div>
                            <div style="font-weight: bold; color: #333;">${chars}</div>
                        </div>
                    `;
                }
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    // 生成紫薇斗数HTML部分
    generateZiweiHTML(resultContent, options = {}) {
        const ziweiSection = resultContent.querySelector('.ziwei-section');
        if (!ziweiSection) return '';

        let html = '<div class="section"><div class="section-title">紫薇斗数分析</div>';

        const chartImageDataUrl = typeof options.chartImageDataUrl === 'string' &&
            options.chartImageDataUrl.startsWith('data:image/')
            ? options.chartImageDataUrl
            : '';
        if (chartImageDataUrl) {
            html += `
                <figure class="ziwei-chart-print" style="margin: 18px 0; page-break-inside: avoid;">
                    <figcaption style="font-weight: bold; margin-bottom: 10px;">紫微斗数完整星盘</figcaption>
                    <img class="ziwei-chart-print-image" src="${chartImageDataUrl}" alt="紫微斗数完整星盘" style="display: block; width: 100%; height: auto; border: 1px solid #cbd5e1;" />
                </figure>
            `;
        }

        // 基本信息
        const basicInfo = ziweiSection.querySelector('.ziwei-basic-info');
        if (basicInfo) {
            const infoRows = basicInfo.querySelectorAll('.info-row');
            infoRows.forEach(row => {
                const label = row.querySelector('.info-label')?.textContent || '';
                const value = row.querySelector('.info-value')?.textContent || '';
                if (label && value) {
                    html += `<p><strong>${label}</strong>${value}</p>`;
                }
            });
        }

        // 命盘分析
        const analysis = ziweiSection.querySelector('.analysis-text pre')?.textContent || '';
        if (analysis) {
            html += `<div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0;"><pre style="white-space: pre-wrap; font-family: inherit;">${analysis}</pre></div>`;
        }

        html += '</div>';
        return html;
    }

    async captureZiweiChartImage(resultContent) {
        const chartFrame = resultContent?.querySelector('.ziwei-chart-frame');
        const chartRoot = resultContent?.querySelector('#ziwei-chart-root');
        if (!chartFrame || !chartRoot) {
            throw new Error('未找到可导出的紫微星盘');
        }
        if (chartRoot.getAttribute('aria-busy') === 'true') {
            throw new Error('紫微星盘仍在绘制，请稍后再生成报告');
        }
        if (typeof html2canvas === 'undefined') {
            throw new Error('星盘截图组件未加载，请检查网络后重试');
        }

        const width = Math.max(chartFrame.scrollWidth || 0, chartFrame.offsetWidth || 0);
        const height = Math.max(chartFrame.scrollHeight || 0, chartFrame.offsetHeight || 0);
        const canvas = await html2canvas(chartFrame, {
            width,
            height,
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            logging: false,
            scrollX: 0,
            scrollY: 0,
            windowWidth: width,
            windowHeight: height
        });
        return canvas.toDataURL('image/png');
    }

    // 创建PDF
    async createPDFFromHTML(htmlContent) {
        if (typeof window.jsPDF === 'undefined' && typeof jsPDF === 'undefined') {
            throw new Error('jsPDF库未加载，请检查网络连接');
        }

        // 获取jsPDF构造函数
        const { jsPDF } = window.jsPDF || window;

        // 创建临时容器
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: 800px;
            background: white;
            max-height: none !important;
            overflow: visible !important;
            height: auto !important;
        `;
        document.body.appendChild(tempDiv);

        try {
            // 等待内容渲染完成
            await new Promise(resolve => setTimeout(resolve, 500));

            // 强制重新计算高度
            const actualHeight = Math.max(
                tempDiv.scrollHeight,
                tempDiv.offsetHeight,
                tempDiv.clientHeight
            );

            console.log('PDF生成 - 计算的实际高度:', actualHeight);

            // 使用html2canvas截图
            const canvas = await html2canvas(tempDiv, {
                width: 800,
                height: actualHeight,
                scale: 2,
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0
            });

            // 创建PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4宽度
            const pageHeight = 295; // A4高度
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // 添加第一页
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // 如果内容超过一页，添加更多页面
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            return pdf;
        } finally {
            document.body.removeChild(tempDiv);
        }
    }

    // 创建Canvas
    async createCanvasFromHTML(htmlContent) {
        // 确保库已加载
        if (typeof html2canvas === 'undefined') {
            console.log('html2canvas未加载，尝试动态加载...');

            if (typeof window.ensureLibrariesLoaded === 'function') {
                const loaded = await window.ensureLibrariesLoaded();
                if (!loaded) {
                    throw new Error('html2canvas库加载失败，请检查网络连接或尝试刷新页面');
                }
            } else {
                throw new Error('html2canvas库未加载，请刷新页面重试');
            }
        }

        // 创建临时容器
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.cssText = `
            position: absolute;
            top: -9999px;
            left: -9999px;
            width: 800px;
            visibility: hidden;
            overflow: visible;
        `;
        document.body.appendChild(tempDiv);

        try {
            // 等待内容渲染完成
            await new Promise(resolve => setTimeout(resolve, 500));

            // 获取实际内容高度
            const actualHeight = Math.max(
                tempDiv.scrollHeight,
                tempDiv.offsetHeight,
                tempDiv.clientHeight
            );

            console.log('Canvas尺寸:', { width: 800, height: actualHeight });

            const canvas = await html2canvas(tempDiv, {
                width: 800,
                height: actualHeight,
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                logging: false,
                removeContainer: false
            });

            return canvas;
        } finally {
            document.body.removeChild(tempDiv);
        }
    }

    // 下载Canvas为图片
    downloadCanvasAsImage(canvas, fileName) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 显示处理状态
    showProcessing(message) {
        // 创建或更新处理提示
        let processingDiv = document.getElementById('global-processing');
        if (!processingDiv) {
            processingDiv = document.createElement('div');
            processingDiv.id = 'global-processing';
            processingDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px 40px;
                border-radius: 10px;
                z-index: 10000;
                text-align: center;
                font-size: 1.1rem;
            `;
            document.body.appendChild(processingDiv);
        }
        processingDiv.textContent = message;
        processingDiv.style.display = 'block';
    }

    // 隐藏处理状态
    hideProcessing() {
        const processingDiv = document.getElementById('global-processing');
        if (processingDiv) {
            processingDiv.style.display = 'none';
        }
    }

    // 打开打印预览（PDF生成失败时的备选方案）
    writePrintWindow(printWindow, reportHTML) {
        if (!printWindow) {
            this.showError('报告窗口不可用，请允许弹出窗口后重试');
            return false;
        }

        let printScheduled = false;
        const triggerPrint = () => {
            if (printScheduled) return;
            printScheduled = true;
            setTimeout(() => {
                if (printWindow.closed) return;
                printWindow.focus?.();
                printWindow.print();
            }, 1000);
        };

        printWindow.document.open?.();
        printWindow.onload = triggerPrint;
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        if (printWindow.document.readyState === 'complete') triggerPrint();
        return true;
    }

    openPrintPreview(printWindow, options = {}) {
        if (!printWindow) {
            this.showError('报告窗口不可用，请允许弹出窗口后重试');
            return;
        }
        const reportHTML = this.generatePrintableHTML(options);
        if (!this.writePrintWindow(printWindow, reportHTML)) return;

        this.showSuccess('已打开打印预览，您可以选择"另存为PDF"保存');
    }

    // 生成适合打印的HTML
    generatePrintableHTML(options = {}) {
        const resultContent = document.querySelector('#zhiming-result .result-content');
        if (!resultContent) return '';

        const title = resultContent.querySelector('.result-title')?.textContent || '';
        const info = resultContent.querySelector('.result-info')?.textContent || '';

        // 获取AI分析结果
        const aiOutput = document.getElementById('ai-output');
        const aiAnalysis = aiOutput ? aiOutput.innerHTML : '';

        return `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <title>赛博论命报告</title>
                <style>
                    * { box-sizing: border-box; }
                    body {
                        font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
                        line-height: 1.8;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                        background: white;
                    }
                    .report-container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        padding: 30px;
                    }
                    .report-header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 3px solid #333;
                        padding-bottom: 20px;
                    }
                    .report-title {
                        font-size: 2.5rem;
                        font-weight: bold;
                        color: #333;
                        margin-bottom: 10px;
                    }
                    .report-subtitle {
                        font-size: 1.2rem;
                        color: #666;
                        margin-bottom: 20px;
                    }
                    .basic-info {
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 25px;
                        border-left: 5px solid #333;
                    }
                    .section {
                        margin-bottom: 25px;
                        padding: 20px;
                        border-radius: 8px;
                        background: #f8f9fa;
                        page-break-inside: avoid;
                    }
                    .section-title {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #333;
                        margin-bottom: 15px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 5px;
                    }
                    .bazi-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .pillar-card {
                        background: white;
                        border: 2px solid #333;
                        border-radius: 8px;
                        padding: 15px;
                        text-align: center;
                    }
                    .pillar-name {
                        font-weight: bold;
                        color: #333;
                        margin-bottom: 8px;
                    }
                    .pillar-chars {
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: #000;
                        margin-bottom: 5px;
                    }
                    .pillar-god {
                        color: #666;
                        font-size: 0.9rem;
                    }
                    .ai-analysis {
                        background: #f0f8ff;
                        border: 2px solid #333;
                        border-radius: 8px;
                        padding: 25px;
                    }
                    .ai-analysis h1, .ai-analysis h2, .ai-analysis h3 {
                        color: #333;
                        margin-top: 20px;
                        margin-bottom: 10px;
                    }
                    .ai-analysis h1 {
                        font-size: 1.8rem;
                        border-bottom: 2px solid #333;
                        padding-bottom: 5px;
                    }
                    .ai-analysis h2 { font-size: 1.5rem; }
                    .ai-analysis h3 { font-size: 1.3rem; }
                    .ai-analysis strong { color: #000; }
                    .ai-analysis em { color: #333; font-style: italic; }
                    .report-footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 2px solid #333;
                        color: #666;
                        font-size: 0.9rem;
                    }
                    @media print {
                        body { margin: 0; padding: 15px; }
                        .report-container { padding: 0; }
                        .section { page-break-inside: avoid; }
                        .bazi-grid { page-break-inside: avoid; }
                        .ai-analysis { page-break-inside: avoid; }
                    }
                    @page { margin: 2cm; size: A4; }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="report-header">
                        <div class="report-title">赛博论命</div>
                        <div class="report-subtitle">完整命理分析报告</div>
                    </div>

                    <div class="basic-info">
                        <strong>基本信息</strong><br>
                        ${info}
                    </div>

                    ${this.generateBaziHTML(resultContent)}
                    ${this.generateSolarTimeHTML(resultContent)}
                    ${this.generateDayunHTML(resultContent)}
                    ${this.generateZiweiHTML(resultContent, options)}

                    ${aiAnalysis ? `
                        <div class="section">
                            <div class="section-title">AI智能分析</div>
                            <div class="ai-analysis">
                                ${aiAnalysis}
                            </div>
                        </div>
                    ` : ''}

                    <div class="report-footer">
                        报告生成时间：${new Date().toLocaleString('zh-CN')}<br>
                        本报告由赛博论命系统生成
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // 生成专用于长图的HTML
    generateLongImageHTML() {
        const resultContent = document.querySelector('#zhiming-result .result-content');
        if (!resultContent) return '';

        const title = resultContent.querySelector('.result-title')?.textContent || '';
        const info = resultContent.querySelector('.result-info')?.textContent || '';

        // 获取AI分析结果
        const aiOutput = document.getElementById('ai-output');
        const aiAnalysis = aiOutput ? aiOutput.innerHTML : '';

        return `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
                        line-height: 1.6;
                        color: #fff;
                        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%);
                        margin: 0;
                        padding: 0;
                        width: 800px;
                        min-height: 100vh;
                    }
                    .long-image-container {
                        width: 800px;
                        padding: 40px;
                        box-sizing: border-box;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding: 30px 0;
                        background: linear-gradient(45deg, rgba(0, 212, 255, 0.2), rgba(255, 0, 128, 0.2));
                        border-radius: 15px;
                        border: 2px solid rgba(0, 212, 255, 0.3);
                    }
                    .main-title {
                        font-size: 3rem;
                        font-weight: bold;
                        background: linear-gradient(45deg, #00d4ff, #ff0080);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        margin-bottom: 15px;
                        text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
                    }
                    .subtitle {
                        font-size: 1.3rem;
                        color: #00d4ff;
                        margin-bottom: 20px;
                    }
                    .basic-info {
                        background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 128, 0.1));
                        padding: 25px;
                        border-radius: 12px;
                        margin-bottom: 30px;
                        border: 1px solid rgba(0, 212, 255, 0.3);
                        text-align: center;
                        font-size: 1.1rem;
                    }
                    .section {
                        margin-bottom: 35px;
                        padding: 25px;
                        border-radius: 12px;
                        background: rgba(0, 0, 0, 0.3);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(10px);
                    }
                    .section-title {
                        font-size: 1.8rem;
                        font-weight: bold;
                        color: #00d4ff;
                        margin-bottom: 20px;
                        text-align: center;
                        border-bottom: 2px solid #00d4ff;
                        padding-bottom: 10px;
                    }
                    .bazi-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 20px;
                        margin: 25px 0;
                    }
                    .pillar-card {
                        background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 128, 0.1));
                        border: 2px solid rgba(0, 212, 255, 0.4);
                        border-radius: 10px;
                        padding: 20px;
                        text-align: center;
                        transition: all 0.3s ease;
                    }
                    .pillar-name {
                        font-weight: bold;
                        color: #ff0080;
                        margin-bottom: 10px;
                        font-size: 1.1rem;
                    }
                    .pillar-chars {
                        font-size: 2rem;
                        font-weight: bold;
                        color: #00d4ff;
                        margin-bottom: 8px;
                        text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
                    }
                    .pillar-god {
                        color: #00ff88;
                        font-size: 1rem;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .info-item {
                        background: rgba(0, 0, 0, 0.2);
                        padding: 15px;
                        border-radius: 8px;
                        border-left: 4px solid #00d4ff;
                    }
                    .info-label {
                        color: #00d4ff;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .info-value {
                        color: #fff;
                        font-size: 1.1rem;
                    }
                    .dayun-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .dayun-item {
                        background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 212, 255, 0.1));
                        border: 1px solid rgba(0, 255, 136, 0.3);
                        border-radius: 8px;
                        padding: 15px;
                        text-align: center;
                    }
                    .dayun-age {
                        color: #00ff88;
                        font-size: 0.9rem;
                        margin-bottom: 5px;
                    }
                    .dayun-chars {
                        color: #fff;
                        font-size: 1.3rem;
                        font-weight: bold;
                    }
                    .ai-analysis {
                        background: linear-gradient(135deg, rgba(255, 0, 128, 0.1), rgba(0, 212, 255, 0.1));
                        border: 2px solid rgba(255, 0, 128, 0.3);
                        border-radius: 12px;
                        padding: 30px;
                        margin: 30px 0;
                    }
                    .ai-analysis h1, .ai-analysis h2, .ai-analysis h3 {
                        color: #00d4ff;
                        margin-top: 25px;
                        margin-bottom: 15px;
                    }
                    .ai-analysis h1 {
                        font-size: 1.8rem;
                        border-bottom: 2px solid #00d4ff;
                        padding-bottom: 8px;
                    }
                    .ai-analysis h2 { font-size: 1.5rem; }
                    .ai-analysis h3 { font-size: 1.3rem; }
                    .ai-analysis strong { color: #ff0080; }
                    .ai-analysis em { color: #00ff88; font-style: italic; }
                    .ai-analysis p { margin: 15px 0; line-height: 1.8; }
                    .footer {
                        text-align: center;
                        margin-top: 40px;
                        padding: 25px;
                        background: rgba(0, 0, 0, 0.3);
                        border-radius: 12px;
                        border-top: 2px solid #00d4ff;
                        color: #ccc;
                    }
                    .watermark {
                        position: absolute;
                        bottom: 20px;
                        right: 20px;
                        opacity: 0.3;
                        font-size: 0.9rem;
                        color: #00d4ff;
                    }
                </style>
            </head>
            <body>
                <div class="long-image-container">
                    <div class="header">
                        <div class="main-title">赛博论命</div>
                        <div class="subtitle">完整命理分析报告</div>
                    </div>

                    <div class="basic-info">
                        <strong>基本信息</strong><br>
                        ${info}
                    </div>

                    ${this.generateBaziHTMLForLongImage(resultContent)}
                    ${this.generateSolarTimeHTMLForLongImage(resultContent)}
                    ${this.generateDayunHTMLForLongImage(resultContent)}
                    ${this.generateZiweiHTMLForLongImage(resultContent)}

                    ${aiAnalysis ? `
                        <div class="section">
                            <div class="section-title">AI智能分析</div>
                            <div class="ai-analysis">
                                ${aiAnalysis}
                            </div>
                        </div>
                    ` : ''}

                    <div class="footer">
                        报告生成时间：${new Date().toLocaleString('zh-CN')}<br>
                        本报告由赛博论命系统生成
                    </div>
                </div>
                <div class="watermark">赛博论命 CyberFortune</div>
            </body>
            </html>
        `;
    }

    // 生成长图专用的八字HTML
    generateBaziHTMLForLongImage(resultContent) {
        const pillars = resultContent.querySelectorAll('.pillar');
        if (pillars.length === 0) return '';

        const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
        let html = '<div class="section"><div class="section-title">八字命盘</div><div class="bazi-grid">';

        pillars.forEach((pillar, index) => {
            const chars = pillar.querySelector('.pillar-chars')?.textContent || '';
            const god = pillar.querySelector('.pillar-god')?.textContent || '';

            html += `
                <div class="pillar-card">
                    <div class="pillar-name">${pillarNames[index] || ''}</div>
                    <div class="pillar-chars">${chars}</div>
                    <div class="pillar-god">${god}</div>
                </div>
            `;
        });

        html += '</div></div>';
        return html;
    }

    // 生成长图专用的真太阳时HTML
    generateSolarTimeHTMLForLongImage(resultContent) {
        const solarTimeSection = resultContent.querySelector('.solar-time-section');
        if (!solarTimeSection) return '';

        let html = '<div class="section"><div class="section-title">真太阳时修正</div><div class="info-grid">';

        const timeRows = solarTimeSection.querySelectorAll('.time-row');
        timeRows.forEach(row => {
            const label = row.querySelector('.time-label')?.textContent || '';
            const value = row.querySelector('.time-value')?.textContent || '';
            if (label && value) {
                html += `
                    <div class="info-item">
                        <div class="info-label">${label}</div>
                        <div class="info-value">${value}</div>
                    </div>
                `;
            }
        });

        html += '</div></div>';
        return html;
    }

    // 生成长图专用的大运HTML
    generateDayunHTMLForLongImage(resultContent) {
        const dayunSection = resultContent.querySelector('.dayun-section');
        if (!dayunSection) return '';

        let html = '<div class="section"><div class="section-title">大运信息</div>';

        const dayunInfo = dayunSection.querySelector('.dayun-info p')?.textContent || '';
        if (dayunInfo) {
            html += `<div class="info-item"><div class="info-value">${dayunInfo}</div></div>`;
        }

        const dayunPillars = dayunSection.querySelectorAll('.dayun-pillar');
        if (dayunPillars.length > 0) {
            html += '<div class="dayun-grid">';
            dayunPillars.forEach(pillar => {
                const age = pillar.querySelector('.dayun-age')?.textContent || '';
                const chars = pillar.querySelector('.dayun-chars')?.textContent || '';
                if (age && chars) {
                    html += `
                        <div class="dayun-item">
                            <div class="dayun-age">${age}</div>
                            <div class="dayun-chars">${chars}</div>
                        </div>
                    `;
                }
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    // 生成长图专用的紫薇斗数HTML
    generateZiweiHTMLForLongImage(resultContent) {
        const ziweiSection = resultContent.querySelector('.ziwei-section');
        if (!ziweiSection) return '';

        let html = '<div class="section"><div class="section-title">紫薇斗数分析</div>';

        // 基本信息
        const basicInfo = ziweiSection.querySelector('.ziwei-basic-info');
        if (basicInfo) {
            html += '<div class="info-grid">';
            const infoRows = basicInfo.querySelectorAll('.info-row');
            infoRows.forEach(row => {
                const label = row.querySelector('.info-label')?.textContent || '';
                const value = row.querySelector('.info-value')?.textContent || '';
                if (label && value) {
                    html += `
                        <div class="info-item">
                            <div class="info-label">${label}</div>
                            <div class="info-value">${value}</div>
                        </div>
                    `;
                }
            });
            html += '</div>';
        }

        // 命盘分析
        const analysis = ziweiSection.querySelector('.analysis-text pre')?.textContent || '';
        if (analysis) {
            html += `
                <div class="info-item" style="margin-top: 20px;">
                    <div class="info-label">命盘分析</div>
                    <div class="info-value" style="white-space: pre-wrap; line-height: 1.8;">${analysis}</div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    // 从现有内容创建Canvas（更可靠的方法）
    async createCanvasFromExistingContent() {
        const resultContent = document.querySelector('#zhiming-result .result-content');
        if (!resultContent) {
            throw new Error('找不到结果内容');
        }

        // 直接使用现有的结果内容进行截图
        try {
            console.log('开始截取现有内容...');

            // 临时修改样式以便截图
            const originalStyle = resultContent.style.cssText;

            // 确保AI分析结果区域完全展开
            const aiOutput = document.getElementById('ai-output');
            const aiOriginalStyle = aiOutput ? aiOutput.style.cssText : '';
            if (aiOutput) {
                aiOutput.style.cssText = `
                    ${aiOriginalStyle}
                    max-height: none !important;
                    overflow: visible !important;
                    height: auto !important;
                `;
            }

            resultContent.style.cssText = `
                ${originalStyle}
                position: relative;
                width: 800px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%);
                color: white;
                padding: 40px;
                box-sizing: border-box;
                margin: 0;
                max-height: none !important;
                overflow: visible !important;
                height: auto !important;
            `;

            // 等待样式应用和重新布局
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 强制重新计算高度
            const actualHeight = Math.max(
                resultContent.scrollHeight,
                resultContent.offsetHeight,
                resultContent.clientHeight
            );

            console.log('计算的实际高度:', actualHeight);

            const canvas = await html2canvas(resultContent, {
                width: 800,
                height: actualHeight,
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#1a1a2e',
                logging: true,
                removeContainer: false,
                scrollX: 0,
                scrollY: 0
            });

            // 恢复原始样式
            resultContent.style.cssText = originalStyle;
            if (aiOutput) {
                aiOutput.style.cssText = aiOriginalStyle;
            }

            console.log('截图完成:', canvas.width, 'x', canvas.height);
            return canvas;

        } catch (error) {
            console.error('截图失败:', error);
            throw error;
        }
    }

    // 生成简化的报告HTML
    generateSimplifiedReportHTML() {
        const resultContent = document.querySelector('#zhiming-result .result-content');
        const title = resultContent.querySelector('.result-title')?.textContent || '';
        const info = resultContent.querySelector('.result-info')?.textContent || '';

        // 获取AI分析结果
        const aiOutput = document.getElementById('ai-output');
        const aiAnalysis = aiOutput ? aiOutput.textContent : '';

        let html = `
            <div style="text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(45deg, rgba(0, 212, 255, 0.2), rgba(255, 0, 128, 0.2)); border-radius: 15px;">
                <h1 style="font-size: 3rem; margin: 0 0 15px 0; background: linear-gradient(45deg, #00d4ff, #ff0080); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">赛博论命</h1>
                <h2 style="font-size: 1.3rem; color: #00d4ff; margin: 0;">完整命理分析报告</h2>
            </div>

            <div style="background: rgba(0, 212, 255, 0.1); padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 1px solid rgba(0, 212, 255, 0.3); text-align: center;">
                <strong style="color: #00d4ff;">基本信息</strong><br>
                <span style="font-size: 1.1rem;">${info}</span>
            </div>
        `;

        // 添加八字信息
        const pillars = resultContent.querySelectorAll('.pillar');
        if (pillars.length > 0) {
            html += `
                <div style="margin-bottom: 35px; padding: 25px; border-radius: 12px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1);">
                    <h3 style="font-size: 1.8rem; color: #00d4ff; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">八字命盘</h3>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
            `;

            const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
            pillars.forEach((pillar, index) => {
                const chars = pillar.querySelector('.pillar-chars')?.textContent || '';
                const god = pillar.querySelector('.pillar-god')?.textContent || '';

                html += `
                    <div style="background: linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 0, 128, 0.1)); border: 2px solid rgba(0, 212, 255, 0.4); border-radius: 10px; padding: 20px; text-align: center;">
                        <div style="font-weight: bold; color: #ff0080; margin-bottom: 10px; font-size: 1.1rem;">${pillarNames[index]}</div>
                        <div style="font-size: 2rem; font-weight: bold; color: #00d4ff; margin-bottom: 8px;">${chars}</div>
                        <div style="color: #00ff88; font-size: 1rem;">${god}</div>
                    </div>
                `;
            });

            html += '</div></div>';
        }

        // 添加AI分析（如果有）
        if (aiAnalysis) {
            html += `
                <div style="margin-bottom: 35px; padding: 25px; border-radius: 12px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.1);">
                    <h3 style="font-size: 1.8rem; color: #00d4ff; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">AI智能分析</h3>
                    <div style="background: linear-gradient(135deg, rgba(255, 0, 128, 0.1), rgba(0, 212, 255, 0.1)); border: 2px solid rgba(255, 0, 128, 0.3); border-radius: 12px; padding: 30px; line-height: 1.8; white-space: pre-wrap;">
                        ${aiAnalysis.substring(0, 1000)}${aiAnalysis.length > 1000 ? '...' : ''}
                    </div>
                </div>
            `;
        }

        // 添加页脚
        html += `
            <div style="text-align: center; margin-top: 40px; padding: 25px; background: rgba(0, 0, 0, 0.3); border-radius: 12px; border-top: 2px solid #00d4ff; color: #ccc;">
                报告生成时间：${new Date().toLocaleString('zh-CN')}<br>
                本报告由赛博论命系统生成
            </div>
        `;

        return html;
    }

    // 测试Canvas生成（调试用）
    async testCanvasGeneration() {
        try {
            console.log('开始测试Canvas生成...');

            // 检查html2canvas是否可用
            if (typeof html2canvas === 'undefined') {
                this.showError('html2canvas库未加载，请检查网络连接');
                return;
            }

            // 创建一个简单的Canvas测试
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');

            // 绘制渐变背景
            const gradient = ctx.createLinearGradient(0, 0, 400, 300);
            gradient.addColorStop(0, '#ff0080');
            gradient.addColorStop(1, '#00d4ff');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 400, 300);

            // 绘制文字
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('Canvas测试成功', 50, 100);

            ctx.font = '16px Arial';
            ctx.fillText('这是一个简单的Canvas测试', 50, 150);
            ctx.fillText('如果您看到这张图片，说明Canvas功能正常', 50, 180);

            // 绘制矩形
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(50, 200, 300, 50);

            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.fillText('测试框内容', 60, 230);

            console.log('Canvas绘制完成:', canvas.width, 'x', canvas.height);

            // 下载测试图片
            this.downloadCanvasAsImage(canvas, 'canvas_test.png');
            this.showSuccess('Canvas测试图片已生成');

        } catch (error) {
            console.error('Canvas测试失败:', error);
            this.showError(`Canvas测试失败: ${error.message}`);
        }
    }

    // 手动创建Canvas（备用方法）
    async createCanvasManually() {
        const resultContent = document.querySelector('#zhiming-result .result-content');
        if (!resultContent) {
            throw new Error('找不到结果内容');
        }

        console.log('使用手动Canvas绘制方法...');

        // 创建Canvas
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1200; // 预设高度，后续可调整
        const ctx = canvas.getContext('2d');

        // 绘制背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.3, '#16213e');
        gradient.addColorStop(0.6, '#0f3460');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let y = 60; // 当前绘制位置

        // 绘制标题
        ctx.fillStyle = '#00d4ff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('赛博论命', canvas.width / 2, y);
        y += 60;

        ctx.font = '24px Arial';
        ctx.fillText('完整命理分析报告', canvas.width / 2, y);
        y += 80;

        // 绘制基本信息
        const info = resultContent.querySelector('.result-info')?.textContent || '';
        if (info) {
            ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
            ctx.fillRect(50, y - 30, canvas.width - 100, 60);

            ctx.fillStyle = '#ffffff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(info, canvas.width / 2, y);
            y += 100;
        }

        // 绘制八字信息
        const pillars = resultContent.querySelectorAll('.pillar');
        if (pillars.length > 0) {
            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('八字命盘', canvas.width / 2, y);
            y += 50;

            const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
            const pillarWidth = 160;
            const pillarHeight = 120;
            const startX = (canvas.width - pillarWidth * 2 - 40) / 2;

            pillars.forEach((pillar, index) => {
                const chars = pillar.querySelector('.pillar-chars')?.textContent || '';
                const god = pillar.querySelector('.pillar-god')?.textContent || '';

                const col = index % 2;
                const row = Math.floor(index / 2);
                const x = startX + col * (pillarWidth + 40);
                const cardY = y + row * (pillarHeight + 20);

                // 绘制卡片背景
                ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
                ctx.fillRect(x, cardY, pillarWidth, pillarHeight);

                // 绘制边框
                ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
                ctx.lineWidth = 2;
                ctx.strokeRect(x, cardY, pillarWidth, pillarHeight);

                // 绘制柱名
                ctx.fillStyle = '#ff0080';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(pillarNames[index], x + pillarWidth / 2, cardY + 25);

                // 绘制八字
                ctx.fillStyle = '#00d4ff';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(chars, x + pillarWidth / 2, cardY + 60);

                // 绘制十神
                ctx.fillStyle = '#00ff88';
                ctx.font = '14px Arial';
                ctx.fillText(god, x + pillarWidth / 2, cardY + 85);
            });

            y += Math.ceil(pillars.length / 2) * (pillarHeight + 20) + 60;
        }

        // 绘制AI分析（如果有）
        const aiOutput = document.getElementById('ai-output');
        if (aiOutput && aiOutput.textContent.trim()) {
            ctx.fillStyle = '#00d4ff';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('AI智能分析', canvas.width / 2, y);
            y += 50;

            // 绘制分析内容背景
            const analysisHeight = 200;
            ctx.fillStyle = 'rgba(255, 0, 128, 0.1)';
            ctx.fillRect(50, y, canvas.width - 100, analysisHeight);

            ctx.strokeStyle = 'rgba(255, 0, 128, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(50, y, canvas.width - 100, analysisHeight);

            // 绘制分析文本（简化版）
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'left';
            const analysisText = aiOutput.textContent.substring(0, 200) + '...';
            const lines = this.wrapText(ctx, analysisText, canvas.width - 120);
            lines.slice(0, 8).forEach((line, index) => {
                ctx.fillText(line, 70, y + 30 + index * 22);
            });

            y += analysisHeight + 40;
        }

        // 绘制页脚
        ctx.fillStyle = '#666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`报告生成时间：${new Date().toLocaleString('zh-CN')}`, canvas.width / 2, y);
        ctx.fillText('本报告由赛博论命系统生成', canvas.width / 2, y + 25);

        // 调整Canvas高度
        const finalHeight = y + 60;
        if (finalHeight !== canvas.height) {
            const newCanvas = document.createElement('canvas');
            newCanvas.width = canvas.width;
            newCanvas.height = finalHeight;
            const newCtx = newCanvas.getContext('2d');
            newCtx.drawImage(canvas, 0, 0);
            return newCanvas;
        }

        return canvas;
    }

    // 文本换行辅助函数
    wrapText(ctx, text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i];
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        return lines;
    }



    // 初始化全局配置
    initGlobalConfig() {
        // 初始化新的配置系统
        this.initNewConfigSystem();
    }

    async requestAIResponse(apiUrl, apiKey, requestBody, options = {}) {
        const client = this.aiConfig?.apiClient || this.configManager?.apiClient;
        if (!client || typeof client.requestAIResponse !== 'function') {
            throw new Error('API 客户端尚未初始化');
        }
        return client.requestAIResponse(apiUrl, apiKey, requestBody, options);
    }

    getApiErrorMessage(errorData, fallback = '未知错误') {
        if (typeof errorData?.error === 'string' && errorData.error.trim()) {
            return errorData.error.trim();
        }
        if (typeof errorData?.error?.message === 'string' && errorData.error.message.trim()) {
            return errorData.error.message.trim();
        }
        if (typeof errorData?.message === 'string' && errorData.message.trim()) {
            return errorData.message.trim();
        }
        return fallback;
    }
    
    // 初始化新的配置系统
    initNewConfigSystem() {
        // 检查配置系统是否可用
        if (typeof ConfigManager !== 'undefined' && typeof AiConfig !== 'undefined') {
            console.log('初始化新的AI配置系统...');

            // config/index.js 已经初始化过全局实例，直接复用以避免重复绑定事件
            this.aiConfig = window.ConfigSystem?.getAIConfig?.() || null;

            if (!this.aiConfig) {
                this.aiConfig = new AiConfig();
                this.aiConfig.init();
            }

            this.configManager = this.aiConfig.configManager;
            
            console.log('新配置系统初始化完成');
        } else {
            console.warn('新配置系统不可用，使用传统配置方式');
        }
    }
    
    // 设置模型加载相关事件
    setupModelLoadingEvents() {
        const providerSelect = document.getElementById('provider-select');
        const apiUrlInput = document.getElementById('global-api-url');
        const apiKeyInput = document.getElementById('global-api-key');
        const loadModelsBtn = document.getElementById('load-models-btn');
        const modelSelect = document.getElementById('global-model');
        
        // 监听提供商变化
        if (providerSelect) {
            providerSelect.addEventListener('change', () => {
                this.updateProviderConfig();
            });
        }
        
        // 监听API地址和密钥变化
        if (apiUrlInput && apiKeyInput) {
            const checkInputs = () => {
                if (apiUrlInput.value.trim() && apiKeyInput.value.trim()) {
                    loadModelsBtn.disabled = false;
                } else {
                    loadModelsBtn.disabled = true;
                }
            };
            
            apiUrlInput.addEventListener('input', checkInputs);
            apiKeyInput.addEventListener('input', checkInputs);
        }
        
        // 监听加载模型按钮点击
        if (loadModelsBtn) {
            loadModelsBtn.addEventListener('click', () => {
                this.loadAvailableModels();
            });
        }
    }
    
    // 更新提供商配置
    updateProviderConfig() {
        const providerSelect = document.getElementById('provider-select');
        const apiUrlInput = document.getElementById('global-api-url');
        const modelSelect = document.getElementById('global-model');
        const providerDisplay = document.getElementById('provider-display');
        
        if (!providerSelect || !apiUrlInput || !modelSelect) return;
        
        const selectedProvider = providerSelect.value;
        
        // 更新显示的提供商名称
        if (providerDisplay) {
            providerDisplay.textContent = providerSelect.options[providerSelect.selectedIndex].text;
        }
        
        // 尝试使用新的配置系统获取默认URL
        let defaultUrl = '';
        if (window.ConfigSystem && window.ConfigSystem.getAIConfig) {
            const aiConfig = window.ConfigSystem.getAIConfig();
            if (aiConfig && aiConfig.configManager) {
                defaultUrl = aiConfig.configManager.getApiUrl(selectedProvider);
            }
        }
        
        // 如果新系统没有返回URL，使用默认值
        if (!defaultUrl) {
            const defaultUrls = {
                'deepseek': 'https://api.deepseek.com/v1/chat/completions',
                'openai': 'https://api.openai.com/v1/chat/completions',
                'anthropic': 'https://api.anthropic.com/v1/messages',
                'alibaba': 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                'zhipu': 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
                'custom': ''
            };
            defaultUrl = defaultUrls[selectedProvider] || '';
        }
        
        if (defaultUrl) {
            apiUrlInput.value = defaultUrl;
        }
        
        // 根据提供商更新模型选项
        this.updateModelOptions(selectedProvider);
        
        // 如果是自定义提供商，启用加载模型按钮
        const loadModelsBtn = document.getElementById('load-models-btn');
        if (loadModelsBtn) {
            const apiKeyInput = document.getElementById('global-api-key');
            if (selectedProvider === 'custom' && apiKeyInput && apiKeyInput.value.trim()) {
                loadModelsBtn.disabled = false;
            } else {
                loadModelsBtn.disabled = true;
            }
        }
    }
    
    // 更新模型选项
    updateModelOptions(provider) {
        // Models are intentionally not inferred from the provider. The API
        // response is the only source for datalist options; manual input stays intact.
        const datalist = document.getElementById('global-model-options');
        if (datalist) datalist.innerHTML = '';
    }
    
    // 加载可用模型
    async loadAvailableModels() {
        const apiUrlInput = document.getElementById('global-api-url');
        const apiKeyInput = document.getElementById('global-api-key');
        const loadModelsBtn = document.getElementById('load-models-btn');
        const modelSelect = document.getElementById('global-model');
        
        if (!apiUrlInput || !apiKeyInput || !loadModelsBtn || !modelSelect) return;
        
        const baseUrl = apiUrlInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        
        if (!baseUrl || !apiKey) {
            this.showConfigMessage('请先输入API地址和密钥', 'error');
            return;
        }
        
        // 禁用按钮，显示加载状态
        loadModelsBtn.disabled = true;
        loadModelsBtn.textContent = '🔄 加载中...';
        
        try {
            // 尝试使用新的配置系统
            if (window.ConfigSystem && window.ConfigSystem.getAIConfig) {
                console.log('使用新的配置系统加载模型');
                
                // 获取配置系统实例
                const aiConfig = window.ConfigSystem.getAIConfig();
                if (!aiConfig || !aiConfig.configManager || !aiConfig.configManager.apiClient) {
                    throw new Error('配置系统未正确初始化');
                }
                
                // 获取提供商和构建模型URL
                const provider = aiConfig.configManager.detectProviderFromUrl(baseUrl) || 'custom';
                const modelsUrl = aiConfig.configManager.getModelsUrl(provider, baseUrl);
                
                console.log(`加载模型: 提供商=${provider}, URL=${modelsUrl}`);
                
                // 使用API客户端加载模型
                const models = await aiConfig.configManager.apiClient.getAvailableModels(modelsUrl, apiKey);
                
                const modelOptions = document.getElementById('global-model-options');
                if (modelOptions) modelOptions.innerHTML = '';
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.label = model.name || model.id;
                    modelOptions?.appendChild(option);
                });
                
                // 选择第一个模型
                if (models.length > 0) {
                    modelSelect.value = models[0].id;
                }
                
                this.showConfigMessage(`成功加载 ${models.length} 个模型`, 'success');
                console.log(`成功加载 ${models.length} 个模型:`, models);
            } else if (this.configManager && this.configManager.apiClient) {
                // 回退到旧方法
                console.log('使用旧配置系统加载模型');
                
                // 构建模型列表API URL
                const modelsUrl = this.configManager.getModelsUrl(baseUrl);
                const models = await this.configManager.apiClient.getAvailableModels(modelsUrl, apiKey);
                
                const modelOptions = document.getElementById('global-model-options');
                if (modelOptions) modelOptions.innerHTML = '';
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.label = model.name || model.id;
                    modelOptions?.appendChild(option);
                });
                
                // 选择第一个模型
                if (models.length > 0) {
                    modelSelect.value = models[0].id;
                }
                
                this.showConfigMessage(`成功加载 ${models.length} 个模型`, 'success');
            } else {
                throw new Error('API客户端不可用');
            }
        } catch (error) {
            console.error('加载模型失败:', error);
            this.showConfigMessage(`加载模型失败: ${error.message}`, 'error');
            
            const modelOptions = document.getElementById('global-model-options');
            if (modelOptions) modelOptions.innerHTML = '';
        } finally {
            // 恢复按钮状态
            loadModelsBtn.disabled = false;
            loadModelsBtn.textContent = '🔄 加载模型';
        }
    }
    
    // 从新系统更新全局配置
    updateGlobalConfigFromNewSystem(config) {
        try {
            // 将新系统的配置转换为全局配置格式
            const globalConfig = {
                apiUrl: config.apiUrl,
                apiKey: config.apiKey,
                model: config.model,
                provider: config.provider,
                savedAt: new Date().toISOString()
            };
            
            // 保存到localStorage
            localStorage.setItem('cyberFortune_globalConfig', JSON.stringify(globalConfig));
            
            // 更新UI状态
            this.updateConfigStatus('✅', '已保存', '#4CAF50');
            this.showConfigMessage('配置保存成功！', 'success');
            
            console.log('全局配置已从新系统更新');
        } catch (error) {
            console.error('更新全局配置失败:', error);
            this.showConfigMessage('保存配置失败', 'error');
        }
    }

    // 绑定全局配置事件
    bindGlobalConfigEvents() {
        const configToggle = document.getElementById('config-toggle');
        const configPanel = document.getElementById('global-config-panel');
        const configOverlay = document.getElementById('config-overlay');
        const configClose = document.getElementById('config-close');
        const saveConfigBtn = document.getElementById('save-global-config');
        const testConfigBtn = document.getElementById('test-global-config');
        const modelSelect = document.getElementById('global-model');
        const apiUrlInput = document.getElementById('global-api-url');

        // 打开配置面板
        if (configToggle) {
            configToggle.addEventListener('click', () => {
                configPanel.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            });
        }

        // 关闭配置面板
        const closeConfig = () => {
            configPanel.style.display = 'none';
            document.body.style.overflow = 'auto';
        };

        if (configOverlay) {
            configOverlay.addEventListener('click', closeConfig);
        }
        if (configClose) {
            configClose.addEventListener('click', closeConfig);
        }

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && configPanel.style.display === 'flex') {
                closeConfig();
            }
        });

        // 模型切换时自动更新API地址
        if (modelSelect && apiUrlInput) {
            modelSelect.addEventListener('change', (e) => {
                const selectedModel = e.target.value;
                const apiUrls = {
                    'deepseek-r1': 'https://api.deepseek.com/v1/chat/completions',
                    'deepseek-chat': 'https://api.deepseek.com/v1/chat/completions',
                    'gpt-4': 'https://api.openai.com/v1/chat/completions',
                    'gpt-3.5-turbo': 'https://api.openai.com/v1/chat/completions',
                    'claude-3-sonnet': 'https://api.anthropic.com/v1/messages',
                    'claude-3-haiku': 'https://api.anthropic.com/v1/messages',
                    'qwen-max': 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
                    'glm-4': 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
                };

                if (apiUrls[selectedModel]) {
                    apiUrlInput.value = apiUrls[selectedModel];
                }
            });
        }

        // 保存配置
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', () => {
                this.saveGlobalConfig();
            });
        }

        // 测试连接
        if (testConfigBtn) {
            testConfigBtn.addEventListener('click', () => {
                this.testGlobalConfig();
            });
        }
    }

    // 加载全局配置
    loadGlobalConfig() {
        try {
            const config = localStorage.getItem('cyberFortune_globalConfig');
            if (config) {
                const parsedConfig = JSON.parse(config);

                const apiUrlInput = document.getElementById('global-api-url');
                const apiKeyInput = document.getElementById('global-api-key');
                const modelSelect = document.getElementById('global-model');

                if (apiUrlInput && parsedConfig.apiUrl) {
                    apiUrlInput.value = parsedConfig.apiUrl;
                }
                if (apiKeyInput && parsedConfig.apiKey) {
                    apiKeyInput.value = parsedConfig.apiKey;
                }
                if (modelSelect && parsedConfig.model) {
                    modelSelect.value = parsedConfig.model;
                }

                this.updateConfigStatus('✅', '已配置', '#4CAF50');
            }
        } catch (error) {
            console.error('加载全局配置失败:', error);
        }
    }

    // 保存全局配置
    saveGlobalConfig() {
        try {
            const baseUrl = document.getElementById('global-api-url').value.trim();
            const apiKey = document.getElementById('global-api-key').value.trim();
            const model = document.getElementById('global-model').value;
            const provider = document.getElementById('provider-select')?.value || 'custom';

            if (!baseUrl || !apiKey) {
                this.showConfigMessage('请填写完整的API配置信息', 'error');
                return;
            }

            // 优先使用新的配置系统
            if (window.ConfigSystem && window.ConfigSystem.getAIConfig) {
                console.log('使用新的配置系统保存配置');
                
                // 获取配置系统实例
                const aiConfig = window.ConfigSystem.getAIConfig();
                if (aiConfig && aiConfig.configManager) {
                    // 使用新系统保存配置
                    const detectedProvider = aiConfig.configManager.detectProviderFromUrl(baseUrl) || provider;
                    const apiUrl = aiConfig.configManager.getApiUrl(detectedProvider, baseUrl);
                    
                    const config = {
                        baseUrl, // 保存基础URL，用于后续的模型加载
                        apiUrl,  // 保存完整的API URL
                        apiKey,
                        model,
                        provider: detectedProvider,
                        savedAt: new Date().toISOString()
                    };
                    
                    // 保存到localStorage
                    localStorage.setItem('cyberFortune_globalConfig', JSON.stringify(config));
                    
                    // 如果新系统有保存方法，也调用它
                    if (typeof aiConfig.saveConfig === 'function') {
                        aiConfig.saveConfig(config);
                    }
                    
                    this.updateConfigStatus('✅', '已保存', '#4CAF50');
                    this.showConfigMessage('配置保存成功！', 'success');
                    
                    // 同步到各个模块
                    this.syncConfigToModules(config);
                    
                    return;
                }
            }
            
            // 回退到旧的配置管理器
            console.log('使用旧的配置管理器保存配置');
            
            // 使用配置管理器构建API URL
            let apiUrl;
            if (this.configManager) {
                const detectedProvider = this.configManager.detectProviderFromUrl(baseUrl) || provider;
                apiUrl = this.configManager.getApiUrl(detectedProvider, baseUrl);
            } else {
                // 回退到手动构建URL
                apiUrl = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
            }

            const config = {
                baseUrl, // 保存基础URL，用于后续的模型加载
                apiUrl,  // 保存完整的API URL
                apiKey,
                model,
                provider: this.configManager ? this.configManager.detectProviderFromUrl(baseUrl) || provider : provider,
                savedAt: new Date().toISOString()
            };

            localStorage.setItem('cyberFortune_globalConfig', JSON.stringify(config));
            this.updateConfigStatus('✅', '已保存', '#4CAF50');
            this.showConfigMessage('配置保存成功！', 'success');

            // 同步到各个模块
            this.syncConfigToModules(config);

        } catch (error) {
            console.error('保存全局配置失败:', error);
            this.showConfigMessage('保存配置失败', 'error');
        }
    }

    // 测试全局配置
    async testGlobalConfig() {
        const baseUrl = document.getElementById('global-api-url').value.trim();
        const apiKey = document.getElementById('global-api-key').value.trim();
        const model = document.getElementById('global-model').value;

        if (!baseUrl || !apiKey) {
            this.showConfigMessage('请先填写API配置信息', 'error');
            return;
        }

        this.updateConfigStatus('🔄', '测试中...', '#FFC107');

        try {
            // 使用配置管理器构建API URL
            let apiUrl;
            if (this.configManager) {
                const provider = this.configManager.detectProviderFromUrl(baseUrl) || 'custom';
                apiUrl = this.configManager.getApiUrl(provider, baseUrl);
            } else {
                // 回退到手动构建URL
                apiUrl = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
            }

            const response = await this.requestAIResponse(apiUrl, apiKey, {
                    model: model,
                    messages: [
                        {
                            role: "user",
                            content: "测试连接"
                        }
                    ],
                    max_tokens: 10
            });

            if (response.ok) {
                this.updateConfigStatus('✅', '连接成功', '#4CAF50');
                this.showConfigMessage('API连接测试成功！', 'success');
            } else {
                const errorData = await response.json().catch(() => ({}));
                this.updateConfigStatus('❌', '连接失败', '#F44336');
                this.showConfigMessage(`连接失败: ${this.getApiErrorMessage(errorData)}`, 'error');
            }
        } catch (error) {
            this.updateConfigStatus('❌', '连接失败', '#F44336');
            this.showConfigMessage(`连接失败: ${error.message}`, 'error');
        }
    }

    // 更新配置状态显示
    updateConfigStatus(indicator, text, color) {
        const statusIndicator = document.querySelector('#config-status .status-indicator');
        const statusText = document.querySelector('#config-status .status-text');

        if (statusIndicator) statusIndicator.textContent = indicator;
        if (statusText) {
            statusText.textContent = text;
            statusText.style.color = color;
        }
    }

    // 显示配置消息
    showConfigMessage(message, type) {
        // 创建消息提示
        const messageDiv = document.createElement('div');
        messageDiv.className = `config-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 3000;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            background: ${type === 'success' ? '#4CAF50' : '#F44336'};
        `;

        document.body.appendChild(messageDiv);

        // 显示动画
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(0)';
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 300);
        }, 3000);
    }

    // 同步配置到各个模块
    syncConfigToModules(config) {
        // 由于各模块已移除独立配置，现在直接使用全局配置
        // 各模块的AI分析函数会自动调用getGlobalConfig()获取配置
        
        // 如果配置管理器可用，更新其配置
        if (this.configManager && typeof this.configManager.updateConfig === 'function') {
            this.configManager.updateConfig(config);
        }
        
        console.log('全局配置已保存，各模块将自动使用全局配置');
    }

    // 获取全局配置
    getGlobalConfig() {
        const isCompletePersonalConfig = (config) => Boolean(
            config &&
            String(config.apiUrl || '').trim() &&
            String(config.apiKey || '').trim() &&
            String(config.model || '').trim()
        );

        try {
            // 首先尝试从配置管理器获取配置
            if (this.configManager && typeof this.configManager.getConfig === 'function') {
                const config = this.configManager.getConfig();
                if (isCompletePersonalConfig(config)) {
                    return config;
                }
            }
            
            // 回退到localStorage
            const storedConfig = localStorage.getItem('cyberFortune_globalConfig');
            if (storedConfig) {
                const parsedConfig = JSON.parse(storedConfig);
                if (isCompletePersonalConfig(parsedConfig)) return parsedConfig;
            }
        } catch (error) {
            console.error('获取全局配置失败:', error);
        }

        const client = this.aiConfig?.apiClient || this.configManager?.apiClient;
        return client?.getBuiltinConfig?.() || {
            apiUrl: 'builtin://cloudflare',
            apiKey: 'server-managed',
            model: 'server-managed',
            provider: 'builtin',
            useBuiltin: true
        };
    }

    // ==================== 合婚AI分析相关函数 ====================

    // 绑定合婚AI分析事件
    bindMarriageAIEvents(marriageData, marriageResult, aiPrompt) {
        // AI分析现在自动开始，无需手动按钮
        const copyBtn = document.getElementById('copy-ai-marriage-result');

        console.log('绑定合婚AI事件:', { copyBtn });

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyMarriageAIResult();
            });
        }
    }

    // 生成合婚AI分析提示词
    generateMarriageAIPrompt(marriageData, marriageResult) {
        const { male, female } = marriageData;

        let prompt = "";
        prompt += `你是一位精通中国传统合婚理论和现代情感心理学的专家，擅长结合八字命理、生肖配对、五行相配、十神关系等传统理论，以及现代心理学、性格分析、情感匹配等科学方法，为情侣提供全面深入的合婚分析和情感指导。\n\n`;

        prompt += `你具备深厚的传统文化底蕴，熟悉《易经》、《子平真诠》、《滴天髓》等经典著作，同时了解现代心理学理论，能够将古代智慧与现代科学相结合，为现代人的情感生活提供有价值的指导。\n\n`;

        prompt += `现在请你对以下这对情侣进行全面的合婚分析：\n\n`;

        // 男方信息
        prompt += `【男方信息】\n`;
        prompt += `姓名：${male.name}\n`;
        prompt += `出生时间：${male.year}年${male.month}月${male.day}日 ${male.hour.toString().padStart(2, '0')}:${(male.minute || 0).toString().padStart(2, '0')}\n`;
        prompt += `出生地区：${male.birthProvince || '未知'} ${male.birthCity || '未知'}\n`;
        prompt += `生肖：${this.getZodiacAnimal(male.year)}\n\n`;

        // 女方信息
        prompt += `【女方信息】\n`;
        prompt += `姓名：${female.name}\n`;
        prompt += `出生时间：${female.year}年${female.month}月${female.day}日 ${female.hour.toString().padStart(2, '0')}:${(female.minute || 0).toString().padStart(2, '0')}\n`;
        prompt += `出生地区：${female.birthProvince || '未知'} ${female.birthCity || '未知'}\n`;
        prompt += `生肖：${this.getZodiacAnimal(female.year)}\n\n`;

        // 本地规则结果只作为模型推理证据，不直接作为最终结论。
        prompt += `【本地规则参考证据】\n`;
        prompt += `本地加权参考分：${marriageResult.totalScore}分 (${marriageResult.level})，仅作参考证据，不得直接作为最终评分或匹配结论。\n\n`;

        prompt += `生肖规则观察值：${marriageResult.shengXiaoMatch.score}分\n`;
        prompt += `${marriageResult.shengXiaoMatch.analysis}\n\n`;

        prompt += `五行规则观察值：${marriageResult.wuXingMatch.score}分\n`;
        prompt += `${marriageResult.wuXingMatch.analysis}\n\n`;

        prompt += `十神规则观察值：${marriageResult.shiShenMatch.score}分\n`;
        prompt += `${marriageResult.shiShenMatch.analysis}\n\n`;

        prompt += `年龄差规则观察值：${marriageResult.ageMatch.score}分\n`;
        prompt += `${marriageResult.ageMatch.analysis}\n\n`;

        prompt += `【综合评分原则】\n`;
        prompt += `最终综合评分必须由你完成全部维度分析后独立给出。请综合命理互动、沟通模式、价值观与生活目标、冲突修复能力、现实条件和长期成长空间；不得照抄本地加权参考分，也不得只围绕该分数微调。\n`;
        prompt += `传统命理内容只能作为文化视角，不能替代双方真实相处、沟通、责任感与共同选择。避免使用“天作之合”“注定不合”等绝对化结论。\n`;
        prompt += `完成详细分析后，请在全文末尾追加一个 JSON 代码块，严格使用以下结构：\n`;
        prompt += `{"score":0到100的整数,"confidence":"高/中/低","summary":"一句话综合结论","dimensions":{"命理互动":0到100,"沟通适配":0到100,"价值观与生活":0到100,"风险修复":0到100},"analysis":"主要优势、风险依据与可执行建议"}\n\n`;

        prompt += `【分析要求】\n`;
        prompt += `请基于以上信息，从以下几个维度进行深入分析：\n\n`;

        prompt += `1. **性格匹配分析**\n`;
        prompt += `   - 根据生肖和出生时间分析双方的性格特点\n`;
        prompt += `   - 分析性格互补性和潜在冲突点\n`;
        prompt += `   - 提供性格磨合的具体建议\n\n`;

        prompt += `2. **情感相处模式**\n`;
        prompt += `   - 分析双方在恋爱中的表现特点\n`;
        prompt += `   - 预测可能的情感发展模式\n`;
        prompt += `   - 提供增进感情的实用方法\n\n`;

        prompt += `3. **婚姻生活预测**\n`;
        prompt += `   - 分析婚后生活的和谐度\n`;
        prompt += `   - 预测可能面临的挑战和机遇\n`;
        prompt += `   - 提供维护婚姻稳定的建议\n\n`;

        prompt += `4. **事业财运配合**\n`;
        prompt += `   - 分析双方事业发展的互助性\n`;
        prompt += `   - 预测财运配合情况\n`;
        prompt += `   - 提供共同发展的策略建议\n\n`;

        prompt += `5. **子女教育观念**\n`;
        prompt += `   - 分析双方的教育理念匹配度\n`;
        prompt += `   - 预测子女运势和教育方向\n`;
        prompt += `   - 提供家庭教育的协调建议\n\n`;

        prompt += `6. **长期发展建议**\n`;
        prompt += `   - 提供具体的相处技巧和沟通方法\n`;
        prompt += `   - 给出化解矛盾的实用策略\n`;
        prompt += `   - 制定增进感情的长期规划\n\n`;

        prompt += `【输出格式要求】\n`;
        prompt += `请按以下格式输出分析结果：\n\n`;

        prompt += `# 🤖 AI深度合婚分析报告\n\n`;

        prompt += `## 📊 综合评估概览\n`;
        prompt += `**AI综合评分**：[分数]/100\n`;
        prompt += `**匹配等级**：[等级评价]\n`;
        prompt += `**核心优势**：[主要优势点]\n`;
        prompt += `**关注要点**：[需要注意的方面]\n\n`;

        prompt += `## 1. 💝 性格匹配分析\n`;
        prompt += `### 男方性格特点\n`;
        prompt += `- [具体分析]\n\n`;
        prompt += `### 女方性格特点\n`;
        prompt += `- [具体分析]\n\n`;
        prompt += `### 性格互补性\n`;
        prompt += `✅ **优势互补**：[具体说明]\n`;
        prompt += `⚠️ **潜在冲突**：[具体说明]\n`;
        prompt += `💡 **磨合建议**：[具体建议]\n\n`;

        prompt += `## 2. 💕 情感相处模式\n`;
        prompt += `### 恋爱表现特点\n`;
        prompt += `- [双方在恋爱中的表现]\n\n`;
        prompt += `### 情感发展预测\n`;
        prompt += `- [可能的发展模式]\n\n`;
        prompt += `### 增进感情方法\n`;
        prompt += `💡 [具体实用方法]\n\n`;

        prompt += `## 3. 🏠 婚姻生活预测\n`;
        prompt += `### 婚后和谐度分析\n`;
        prompt += `- [详细分析]\n\n`;
        prompt += `### 可能的挑战与机遇\n`;
        prompt += `⚠️ **挑战**：[具体挑战]\n`;
        prompt += `✅ **机遇**：[具体机遇]\n\n`;
        prompt += `### 婚姻稳定建议\n`;
        prompt += `💡 [具体建议]\n\n`;

        prompt += `## 4. 💼 事业财运配合\n`;
        prompt += `### 事业互助性\n`;
        prompt += `- [分析双方事业发展的互助性]\n\n`;
        prompt += `### 财运配合情况\n`;
        prompt += `- [财运配合分析]\n\n`;
        prompt += `### 共同发展策略\n`;
        prompt += `💡 [具体策略建议]\n\n`;

        prompt += `## 5. 👶 子女教育观念\n`;
        prompt += `### 教育理念匹配度\n`;
        prompt += `- [分析双方教育理念]\n\n`;
        prompt += `### 子女运势预测\n`;
        prompt += `- [子女运势和教育方向]\n\n`;
        prompt += `### 家庭教育协调\n`;
        prompt += `💡 [协调建议]\n\n`;

        prompt += `## 6. 🌟 长期发展建议\n`;
        prompt += `### 相处技巧\n`;
        prompt += `💡 [具体的相处技巧和沟通方法]\n\n`;
        prompt += `### 矛盾化解策略\n`;
        prompt += `💡 [化解矛盾的实用策略]\n\n`;
        prompt += `### 感情增进规划\n`;
        prompt += `💡 [长期感情增进规划]\n\n`;

        prompt += `## 📝 总结与祝福\n`;
        prompt += `[对这对情侣的总结性评价和美好祝福]\n\n`;

        prompt += `## 合婚输出质量控制（必须执行）\n`;
        prompt += `- 本地生肖、五行、十神和年龄规则只是观察证据，不能直接决定匹配等级或最终分数；先解释证据，再结合现代关系因素独立判断。\n`;
        prompt += `- 资料中没有提供的完整命盘、性格经历、沟通记录或现实条件不得臆测；明确区分“输入事实”“传统文化视角”和“需要双方验证的假设”。\n`;
        prompt += `- 不使用“注定、必然、天作之合、绝对不合”等宿命化结论，不把生肖或八字当作替代沟通、同意、责任和专业咨询的依据。\n`;
        prompt += `- 重点回答普通人最关心的实际问题：哪里容易误会、冲突如何发生、如何沟通、如何共同做决定；每项风险都要配一个具体可执行的修复动作。\n`;
        prompt += `- 关于财务、健康、生育、子女和法律等敏感话题，只能给一般性的讨论框架和沟通建议，不能作预测、诊断或保证。\n`;
        prompt += `- 结论要体现不确定性和双方能动性，避免把低置信度证据写成高置信度判断；JSON 必须是全文最后一个内容，且分数、维度、摘要和正文保持一致。\n\n`;

        prompt += `请确保分析专业、详细、实用，既要体现传统合婚理论的深度，也要结合现代情感心理学的科学性，为这对情侣提供真正有价值的指导建议。分析应该具体、可操作，避免空泛的表述。`;

        return prompt;
    }

    parseMarriageAIResponse(content) {
        if (typeof content !== 'string' || !content.trim()) return null;

        const fencedBlocks = [...content.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)]
            .map((match) => match[1].trim())
            .filter(Boolean)
            .reverse();
        const balancedObjects = this.extractStructuredJSONObjects(content, 'score');
        const candidates = [...fencedBlocks, ...balancedObjects, content.trim()];
        const cleanText = (value, maxLength = 1000) =>
            typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

        for (const candidate of candidates) {
            let data;
            try {
                data = JSON.parse(candidate);
            } catch (error) {
                continue;
            }

            if (!data || typeof data !== 'object' || !Number.isInteger(data.score) || data.score < 0 || data.score > 100) {
                continue;
            }

            const dimensions = {};
            if (data.dimensions && typeof data.dimensions === 'object' && !Array.isArray(data.dimensions)) {
                Object.entries(data.dimensions).forEach(([label, value]) => {
                    if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100) {
                        dimensions[String(label).trim().slice(0, 40)] = Math.round(value);
                    }
                });
            }

            return {
                score: data.score,
                confidence: cleanText(data.confidence, 20),
                summary: cleanText(data.summary, 300),
                dimensions,
                analysis: cleanText(data.analysis, 2000)
            };
        }

        return null;
    }

    getMarriageAIScoreResult() {
        if (this.marriageAIScoreResult) return this.marriageAIScoreResult;
        const parsed = this.parseMarriageAIResponse(this.fullMarriageAIResponse || '');
        if (parsed) this.marriageAIScoreResult = parsed;
        return parsed;
    }

    applyMarriageAIScore(content) {
        const parsed = this.parseMarriageAIResponse(content);
        const scoreNumber = document.getElementById('marriage-ai-score-number');
        const scoreStatus = document.getElementById('marriage-ai-score-status');
        const scoreSummary = document.getElementById('marriage-ai-score-summary');
        const scoreDimensions = document.getElementById('marriage-ai-score-dimensions');

        if (!parsed) {
            this.marriageAIScoreResult = null;
            if (scoreNumber) scoreNumber.textContent = '--';
            if (scoreStatus) scoreStatus.textContent = 'AI未返回可校验的综合评分';
            if (scoreSummary) scoreSummary.textContent = '详细分析已保留，但本次最终结论不可用。';
            if (scoreDimensions) scoreDimensions.innerHTML = '';
            return null;
        }

        this.marriageAIScoreResult = parsed;
        if (scoreNumber) scoreNumber.textContent = String(parsed.score);
        if (scoreStatus) {
            scoreStatus.textContent = `大模型已完成综合判断${parsed.confidence ? ` · 可信度：${parsed.confidence}` : ''}`;
        }
        if (scoreSummary) scoreSummary.textContent = parsed.summary || 'AI综合结论已生成';
        if (scoreDimensions) {
            const entries = Object.entries(parsed.dimensions);
            scoreDimensions.innerHTML = entries.length
                ? entries.map(([label, score]) => `<span>${this.escapeHTML(label)}：${score}</span>`).join('')
                : '';
        }

        return parsed;
    }

    // 获取生肖
    getZodiacAnimal(year) {
        const zodiacAnimals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
        return zodiacAnimals[(year - 4) % 12];
    }

    // 生成合婚AI分析
    async generateMarriageAIAnalysis(marriageData, marriageResult, aiPrompt) {
        console.log('开始生成合婚AI分析');

        // 使用全局配置
        const globalConfig = this.getGlobalConfig();
        console.log('获取到的AI配置:', {
            provider: globalConfig?.provider || 'unknown',
            model: globalConfig?.model || 'unknown',
            hasApiKey: Boolean(globalConfig?.apiKey)
        });

        if (!globalConfig) {
            console.error('未找到AI配置');
            this.showMarriageAIError('请先配置AI设置');
            return;
        }

        const apiUrl = globalConfig.apiUrl;
        const apiKey = globalConfig.apiKey;
        const modelName = String(globalConfig.model || '').trim();

        // 验证输入
        if (!apiKey) {
            this.showMarriageAIError('请输入API密钥');
            return;
        }
        if (!apiUrl) {
            this.showMarriageAIError('请输入API地址');
            return;
        }
        if (!modelName) {
            this.showMarriageAIError('请输入模型名称');
            return;
        }

        // 显示处理状态
        this.showMarriageAIProcessing();

        try {
            // 调用AI API
            await this.callMarriageAIAPI(aiPrompt, apiKey, modelName, apiUrl);

        } catch (error) {
            console.error('AI合婚分析失败:', error);
            this.showMarriageAIError(error.message);
        } finally {
            this.hideMarriageAIProcessing();
        }
    }

    // 调用合婚AI API
    async callMarriageAIAPI(prompt, apiKey, modelName, apiUrl) {
        const processingSteps = document.getElementById('ai-marriage-processing-steps');
        const processingMessage = document.getElementById('ai-marriage-processing-message');
        const resultSection = document.getElementById('ai-marriage-result-section');
        const output = document.getElementById('ai-marriage-output');
        const copyBtn = document.getElementById('copy-ai-marriage-result');

        const requestBody = {
            model: modelName,
            messages: [
                {
                    role: 'system',
                    content: '你是传统合婚文化与现代关系沟通分析助手。请把生肖、五行、十神和年龄规则当作参考证据，结合沟通、价值观、冲突修复和现实条件独立判断；不做宿命化预测，不臆测缺失资料，不替代心理、医疗、法律或财务专业意见，并严格遵守用户提示中的报告结构和末尾 JSON 要求。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            stream: true,
            temperature: 0.6,
            max_tokens: 6000
        };

        try {
            // 显示连接状态
            processingSteps.innerHTML = '🔗 正在连接AI服务器...<br>';
            processingMessage.textContent = '建立连接中...';

            console.log('合婚AI分析开始:', { apiUrl, modelName, promptLength: prompt.length });

            processingSteps.innerHTML += '📡 发送分析请求...<br>';
            processingMessage.textContent = '正在发送请求...';

            const response = await this.requestAIResponse(apiUrl, apiKey, requestBody);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API错误 (${response.status}): ${this.getApiErrorMessage(errorData)}`);
            }

            processingSteps.innerHTML += '🧠 AI正在分析中...<br>';
            processingMessage.textContent = '正在生成分析结果...';

            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';
            let buffer = '';

            if (resultSection) {
                resultSection.style.display = 'block';
                if (output) output.innerHTML = '<div class="ai-response-streaming">正在生成分析...</div>';
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content || '';
                            if (content) {
                                fullResponse += content;
                                // 实时更新显示
                                if (output) {
                                    output.innerHTML = this.formatMarriageAIResponse(fullResponse);
                                }
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }

            this.fullMarriageAIResponse = fullResponse;
            this.applyMarriageAIScore(fullResponse);
            processingSteps.innerHTML += '✅ 分析完成！<br>';
            processingMessage.textContent = '分析完成';

            // 显示复制按钮
            if (copyBtn && fullResponse.trim()) {
                copyBtn.style.display = 'inline-block';
            }

            console.log('合婚AI分析完成');

        } catch (error) {
            console.error('流式合婚分析失败，尝试非流式调用:', error);

            try {
                const nonStreamResponse = await this.requestAIResponse(apiUrl, apiKey, { ...requestBody, stream: false });
                if (!nonStreamResponse.ok) {
                    const errorData = await nonStreamResponse.json().catch(() => ({}));
                    throw new Error(`API错误 (${nonStreamResponse.status}): ${this.getApiErrorMessage(errorData)}`);
                }

                const result = await nonStreamResponse.json();
                const content = result.choices?.[0]?.message?.content || '';
                if (!content) throw new Error('AI返回内容为空');

                if (resultSection) resultSection.style.display = 'block';
                if (output) output.innerHTML = this.formatMarriageAIResponse(content);
                this.fullMarriageAIResponse = content;
                this.applyMarriageAIScore(content);
                if (copyBtn) copyBtn.style.display = 'inline-block';
            } catch (fallbackError) {
                throw new Error(`API通信失败: ${fallbackError.message}`);
            }
        }
    }

    // 显示合婚AI处理状态
    showMarriageAIProcessing() {
        const processingDiv = document.getElementById('ai-marriage-processing');
        const generateBtn = document.getElementById('generate-marriage-ai-analysis');

        if (processingDiv) {
            processingDiv.style.display = 'block';
        }
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.querySelector('span').textContent = '🧠 正在分析中...';
        }
    }

    // 隐藏合婚AI处理状态
    hideMarriageAIProcessing() {
        const processingDiv = document.getElementById('ai-marriage-processing');
        const generateBtn = document.getElementById('generate-marriage-ai-analysis');

        if (processingDiv) {
            processingDiv.style.display = 'none';
        }
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.querySelector('span').textContent = '🧠 生成AI深度分析';
        }
    }

    // 显示合婚AI错误
    showMarriageAIError(message) {
        console.error('合婚AI错误:', message);

        this.marriageAIScoreResult = null;
        const scoreNumber = document.getElementById('marriage-ai-score-number');
        const scoreStatus = document.getElementById('marriage-ai-score-status');
        if (scoreNumber) scoreNumber.textContent = '--';
        if (scoreStatus) scoreStatus.textContent = `AI综合判断未生成：${message}`;

        const resultSection = document.getElementById('ai-marriage-result-section');
        const output = document.getElementById('ai-marriage-output');

        console.log('错误显示元素:', { resultSection, output });

        if (resultSection && output) {
            resultSection.style.display = 'block';
            output.innerHTML = `
                <div class="ai-error">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">${message}</div>
                    <div class="error-suggestion">请检查AI配置或稍后重试</div>
                </div>
            `;
        } else {
            console.error('未找到错误显示元素');
            alert('AI分析错误: ' + message);
        }
    }

    // 复制合婚AI分析结果
    copyMarriageAIResult() {
        const output = document.getElementById('ai-marriage-output');
        if (!output) return;

        const text = output.textContent || output.innerText;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showConfigMessage('分析结果已复制到剪贴板', 'success');
            }).catch(err => {
                console.error('复制失败:', err);
                this.fallbackCopyText(text);
            });
        } else {
            this.fallbackCopyText(text);
        }
    }

    // 备用复制方法
    fallbackCopyText(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            this.showConfigMessage('分析结果已复制到剪贴板', 'success');
        } catch (err) {
            console.error('复制失败:', err);
            this.showConfigMessage('复制失败，请手动选择文本复制', 'error');
        }

        document.body.removeChild(textArea);
    }

    // ==================== PDF下载功能 ====================

    // 绑定起名模块下载事件
    bindNamingDownloadEvents(birthData, baziResult, nameSuggestions) {
        const downloadPdfBtn = document.getElementById('download-naming-pdf-btn');
        const downloadTextBtn = document.getElementById('download-naming-text-btn');

        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', () => {
                this.downloadNamingPDFReport(birthData, baziResult, nameSuggestions);
            });
        }

        if (downloadTextBtn) {
            downloadTextBtn.addEventListener('click', () => {
                this.downloadNamingTextReport(birthData, baziResult, nameSuggestions);
            });
        }
    }

    // 绑定测名模块下载事件
    bindCemingDownloadEvents(testData, nameAnalysis, baziResult) {
        const downloadPdfBtn = document.getElementById('download-ceming-pdf-btn');
        const downloadTextBtn = document.getElementById('download-ceming-text-btn');

        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', () => {
                this.downloadCemingPDFReport(testData, nameAnalysis, baziResult);
            });
        }

        if (downloadTextBtn) {
            downloadTextBtn.addEventListener('click', () => {
                this.downloadCemingTextReport(testData, nameAnalysis, baziResult);
            });
        }
    }

    // 绑定合婚模块下载事件
    bindMarriageDownloadEvents(marriageData, marriageResult) {
        const downloadPdfBtn = document.getElementById('download-marriage-pdf-btn');
        const downloadTextBtn = document.getElementById('download-marriage-text-btn');

        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', () => {
                this.downloadMarriagePDFReport(marriageData, marriageResult);
            });
        }

        if (downloadTextBtn) {
            downloadTextBtn.addEventListener('click', () => {
                this.downloadMarriageTextReport(marriageData, marriageResult);
            });
        }
    }

    // 格式化合婚AI响应
    formatMarriageAIResponse(text) {
        if (!text) return '<div class="ai-response-streaming">正在生成分析...</div>';

        let formatted = text;

        // 处理标题层级
        formatted = formatted
            .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
            .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
            .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
            .replace(/^#### (.*?)$/gm, '<h4>$1</h4>');

        // 处理粗体和斜体
        formatted = formatted
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        // 处理编号列表和要点
        formatted = formatted
            .replace(/^(\d+)\.\s*\*\*(.*?)\*\*/gm, '<div class="analysis-point"><strong>$1. $2</strong></div>')
            .replace(/^(\d+)\.\s*(.*?)$/gm, '<div class="analysis-point"><strong>$1. $2</strong></div>')
            .replace(/^-\s*(.*?)$/gm, '<li>$1</li>');

        // 处理特殊标记
        formatted = formatted
            .replace(/【(.*?)】/g, '<span class="highlight">【$1】</span>')
            .replace(/💡\s*(.*?)$/gm, '<div class="suggestion-box">💡 $1</div>')
            .replace(/⚠️\s*(.*?)$/gm, '<div class="warning-box">⚠️ $1</div>')
            .replace(/✅\s*(.*?)$/gm, '<div class="success-box">✅ $1</div>');

        // 处理段落
        const lines = formatted.split('\n');
        let result = '';
        let inList = false;
        let currentParagraph = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line === '') {
                if (currentParagraph) {
                    result += `<p>${currentParagraph}</p>\n`;
                    currentParagraph = '';
                }
                if (inList) {
                    result += '</ul>\n';
                    inList = false;
                }
                continue;
            }

            if (line.startsWith('<li>')) {
                if (currentParagraph) {
                    result += `<p>${currentParagraph}</p>\n`;
                    currentParagraph = '';
                }
                if (!inList) {
                    result += '<ul>\n';
                    inList = true;
                }
                result += line + '\n';
            } else if (line.startsWith('<h') || line.startsWith('<div class="analysis-point">') ||
                      line.startsWith('<div class="suggestion-box">') || line.startsWith('<div class="warning-box">') ||
                      line.startsWith('<div class="success-box">')) {
                if (currentParagraph) {
                    result += `<p>${currentParagraph}</p>\n`;
                    currentParagraph = '';
                }
                if (inList) {
                    result += '</ul>\n';
                    inList = false;
                }
                result += line + '\n';
            } else {
                if (inList) {
                    result += '</ul>\n';
                    inList = false;
                }
                if (currentParagraph) {
                    currentParagraph += '<br>' + line;
                } else {
                    currentParagraph = line;
                }
            }
        }

        // 处理最后的段落和列表
        if (currentParagraph) {
            result += `<p>${currentParagraph}</p>\n`;
        }
        if (inList) {
            result += '</ul>\n';
        }

        return this.sanitizeAIHTML(`<div class="ai-response-content">${result}</div>`);
    }

    // ==================== 起名模块PDF生成 ====================

    // 下载起名PDF报告
    downloadNamingPDFReport(birthData, baziResult, nameSuggestions) {
        const resultContent = document.querySelector('#qiming-result .result-content');
        if (!resultContent) {
            this.showError('没有可下载的报告内容');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            this.showError('报告窗口被浏览器拦截，请允许弹出窗口后重试');
            return;
        }

        this.showProcessing('正在准备PDF报告...');

        setTimeout(() => {
            this.hideProcessing();
            this.openNamingPrintPreview(birthData, baziResult, nameSuggestions, printWindow);
        }, 500);
    }

    // 长图下载功能已移除，简化界面

    // 下载起名文本报告
    downloadNamingTextReport(birthData, baziResult, nameSuggestions) {
        const resultContent = document.querySelector('#qiming-result .result-content');
        if (!resultContent) {
            this.showError('没有可下载的报告内容');
            return;
        }

        const reportText = this.generateNamingCompleteReport(birthData, baziResult, nameSuggestions);

        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `赛博起名文本报告_${birthData.name}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        this.showSuccess('文本报告已下载');
    }

    // 生成起名完整报告文本
    generateNamingCompleteReport(birthData, baziResult, nameSuggestions) {
        let report = '';

        // 报告标题
        report += '赛博起名 - 完整起名分析报告\n';
        report += '='.repeat(60) + '\n\n';

        // 基本信息
        report += `姓氏：${birthData.surname}\n`;
        report += `性别：${birthData.gender}\n`;
        report += `出生时间：${birthData.year}年${birthData.month}月${birthData.day}日 ${birthData.hour.toString().padStart(2, '0')}:${(birthData.minute || 0).toString().padStart(2, '0')}\n`;
        report += `出生地区：${birthData.birthProvince} ${birthData.birthCity}\n\n`;

        // 八字信息
        report += '生辰八字\n';
        report += '-'.repeat(30) + '\n';
        report += `年柱：${baziResult.yearPillar} (${baziResult.yearTenGod})\n`;
        report += `月柱：${baziResult.monthPillar} (${baziResult.monthTenGod})\n`;
        report += `日柱：${baziResult.dayPillar} (日主${baziResult.dayTianGan})\n`;
        report += `时柱：${baziResult.hourPillar} (${baziResult.hourTenGod})\n\n`;

        // 五行分析
        report += '五行分析\n';
        report += '-'.repeat(30) + '\n';
        const wuxingStats = this.getWuXingStats(baziResult);
        Object.entries(wuxingStats).forEach(([element, count]) => {
            report += `${element}：${count}个\n`;
        });
        report += '\n';

        // AI 综合排名
        report += 'AI综合排名前5\n';
        report += '-'.repeat(30) + '\n';
        const rankedNames = this.getAINamingTop5ForReport();
        if (!rankedNames.length) {
            report += 'AI尚未返回可校验的前5排名，请等待分析完成后再下载报告。\n\n';
        }
        rankedNames.forEach((suggestion, index) => {
            report += `${index + 1}. ${suggestion.fullName}\n`;
            report += `   AI综合评分：${suggestion.aiScore}分\n`;
            report += `   推荐理由：${suggestion.reason}\n`;
            if (suggestion.tradeoff) report += `   需要权衡：${suggestion.tradeoff}\n`;
            report += `   五行：${(suggestion.wuXingMatch || []).join('、') || '待考'}\n`;
            report += `   用字：${(suggestion.characterDetails || []).map((item) => `${item.char}${item.traditionalForm && item.traditionalForm !== item.char ? `→${item.traditionalForm}` : ''}（${item.element || '未分类'}·${item.strokes || '?'}画）`).join('、')}\n`;
            report += `   出处：${suggestion.source?.work || '待考'}${suggestion.source?.section ? ` · ${suggestion.source.section}` : ''}\n`;
            report += `   原文：${suggestion.source?.quote || '暂无已核验引文'}\n`;
            this.getNamingCharacterSourceLines(suggestion).forEach((item) => {
                report += `   取字“${item.char}”：${item.sourceTitle}，见“${item.quote}”\n`;
            });
            report += `   寓意：${suggestion.source?.meaning || '请结合原典语境复核'}\n\n`;
        });

        // AI分析结果
        const aiOutput = document.getElementById('ai-naming-output');
        if (aiOutput && aiOutput.textContent.trim()) {
            report += 'AI深度分析\n';
            report += '-'.repeat(30) + '\n';
            report += aiOutput.textContent.trim() + '\n\n';
        }

        // 报告尾部
        report += '-'.repeat(60) + '\n';
        report += `报告生成时间：${new Date().toLocaleString('zh-CN')}\n`;
        report += '本报告由赛博起名系统生成\n';

        return report;
    }

    // 打开起名打印预览
    openNamingPrintPreview(birthData, baziResult, nameSuggestions, printWindow = null) {
        const reportHTML = this.generateNamingPrintableHTML(birthData, baziResult, nameSuggestions);

        printWindow ||= window.open('', '_blank', 'width=800,height=600');
        if (!this.writePrintWindow(printWindow, reportHTML)) return;

        this.showSuccess('已打开打印预览，您可以选择"另存为PDF"保存');
    }

    // 生成起名报告HTML（用于长图生成）
    generateNamingReportHTML(birthData, baziResult, nameSuggestions) {
        const aiOutput = document.getElementById('ai-naming-output');
        const aiAnalysis = aiOutput ? aiOutput.innerHTML : '';
        const rankedNames = this.getAINamingTop5ForReport();

        return `
            <div style="width: 800px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%); color: white; padding: 40px; box-sizing: border-box; font-family: 'Microsoft YaHei', Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="font-size: 2.5rem; color: #00d4ff; margin-bottom: 10px; text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);">赛博起名</h1>
                    <h2 style="font-size: 1.2rem; color: #00ff88; margin: 0;">完整起名分析报告</h2>
                </div>

                <div style="background: rgba(0, 212, 255, 0.1); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(0, 212, 255, 0.3);">
                    <h3 style="color: #00d4ff; margin-bottom: 15px; font-size: 1.3rem;">基本信息</h3>
                    <div style="line-height: 1.8; font-size: 1.1rem;">
                        <div><strong style="color: #00ff88;">姓名：</strong>${birthData.name}</div>
                        <div><strong style="color: #00ff88;">性别：</strong>${birthData.gender}</div>
                        <div><strong style="color: #00ff88;">出生时间：</strong>${birthData.year}年${birthData.month}月${birthData.day}日 ${birthData.hour.toString().padStart(2, '0')}:${(birthData.minute || 0).toString().padStart(2, '0')}</div>
                        <div><strong style="color: #00ff88;">出生地区：</strong>${birthData.birthProvince} ${birthData.birthCity}</div>
                    </div>
                </div>

                <div style="background: rgba(0, 255, 136, 0.1); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(0, 255, 136, 0.3);">
                    <h3 style="color: #00ff88; margin-bottom: 20px; font-size: 1.3rem;">生辰八字</h3>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                        <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(0, 212, 255, 0.3);">
                            <div style="color: #00d4ff; font-weight: bold; margin-bottom: 8px;">年柱</div>
                            <div style="font-size: 1.3rem; font-weight: bold; margin: 8px 0;">${baziResult.yearPillar}</div>
                            <div style="color: #00ff88; font-size: 0.9rem;">${baziResult.yearTenGod}</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(0, 212, 255, 0.3);">
                            <div style="color: #00d4ff; font-weight: bold; margin-bottom: 8px;">月柱</div>
                            <div style="font-size: 1.3rem; font-weight: bold; margin: 8px 0;">${baziResult.monthPillar}</div>
                            <div style="color: #00ff88; font-size: 0.9rem;">${baziResult.monthTenGod}</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(0, 212, 255, 0.3);">
                            <div style="color: #00d4ff; font-weight: bold; margin-bottom: 8px;">日柱</div>
                            <div style="font-size: 1.3rem; font-weight: bold; margin: 8px 0;">${baziResult.dayPillar}</div>
                            <div style="color: #00ff88; font-size: 0.9rem;">日主${baziResult.dayTianGan}</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(0, 212, 255, 0.3);">
                            <div style="color: #00d4ff; font-weight: bold; margin-bottom: 8px;">时柱</div>
                            <div style="font-size: 1.3rem; font-weight: bold; margin: 8px 0;">${baziResult.hourPillar}</div>
                            <div style="color: #00ff88; font-size: 0.9rem;">${baziResult.hourTenGod}</div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(255, 0, 128, 0.1); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(255, 0, 128, 0.3);">
                    <h3 style="color: #ff0080; margin-bottom: 20px; font-size: 1.3rem;">五行分析</h3>
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
                        ${this.generateWuXingStatsHTMLForReport(baziResult)}
                    </div>
                </div>

                <div style="background: rgba(0, 212, 255, 0.1); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(0, 212, 255, 0.3);">
                    <h3 style="color: #00d4ff; margin-bottom: 20px; font-size: 1.3rem;">AI综合排名前5</h3>
                    ${rankedNames.length ? rankedNames.map((suggestion, index) => `
                        <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #00ff88;">
                            <div style="font-size: 1.2rem; font-weight: bold; color: #00ff88; margin-bottom: 10px;">${index + 1}. ${suggestion.fullName} <span style="color: #00d4ff;">(${suggestion.aiScore}分)</span></div>
                            <div style="margin: 8px 0;"><strong style="color: #00ff88;">推荐理由：</strong>${suggestion.reason}</div>
                            ${suggestion.tradeoff ? `<div style="margin: 8px 0;"><strong style="color: #f7c873;">需要权衡：</strong>${suggestion.tradeoff}</div>` : ''}
                            <div style="margin: 8px 0;"><strong style="color: #00ff88;">五行：</strong>${(suggestion.wuXingMatch || []).join('、') || '待考'}</div>
                            <div style="margin: 8px 0;"><strong style="color: #00ff88;">出处：</strong>${suggestion.source?.work || '待考'}${suggestion.source?.section ? ` · ${suggestion.source.section}` : ''}</div>
                            <div style="margin: 8px 0;"><strong style="color: #00ff88;">原文：</strong>“${suggestion.source?.quote || '暂无已核验引文'}”</div>
                            ${this.getNamingCharacterSourceLines(suggestion).map((item) => `<div style="margin: 8px 0;"><strong style="color: #00ff88;">取字“${item.char}”：</strong>${item.sourceTitle}，见“${item.quote}”</div>`).join('')}
                        </div>
                    `).join('') : '<p>AI尚未返回可校验的前5排名，请等待分析完成后再生成报告。</p>'}
                </div>

                ${aiAnalysis ? `
                    <div style="background: rgba(0, 255, 136, 0.1); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(0, 255, 136, 0.3);">
                        <h3 style="color: #00ff88; margin-bottom: 20px; font-size: 1.3rem;">AI智能分析</h3>
                        <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 8px; line-height: 1.8;">
                            ${aiAnalysis}
                        </div>
                    </div>
                ` : ''}

                <div style="text-align: center; margin-top: 40px; padding: 25px; background: rgba(0, 0, 0, 0.3); border-radius: 12px; border-top: 2px solid #00d4ff; color: #ccc;">
                    报告生成时间：${new Date().toLocaleString('zh-CN')}<br>
                    本报告由赛博起名系统生成
                </div>
            </div>
        `;
    }

    // 生成五行统计HTML（用于报告）
    generateWuXingStatsHTMLForReport(baziResult) {
        const wuxingStats = this.getWuXingStats(baziResult);
        return Object.entries(wuxingStats).map(([element, count]) => `
            <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(0, 212, 255, 0.3);">
                <div style="font-weight: bold; color: #00d4ff; margin-bottom: 5px;">${element}</div>
                <div style="font-size: 1.2rem; color: #00ff88;">${count}个</div>
            </div>
        `).join('');
    }

    // 生成起名可打印HTML
    generateNamingPrintableHTML(birthData, baziResult, nameSuggestions) {
        const aiOutput = document.getElementById('ai-naming-output');
        const aiAnalysis = aiOutput ? aiOutput.innerHTML : '';
        const rankedNames = this.getAINamingTop5ForReport();

        return `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>赛博起名报告</title>
                <link rel="stylesheet" href="css/print.css">
                <style>
                    body { font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .report-container { max-width: 800px; margin: 0 auto; padding: 20px; }
                    .report-header { text-align: center; border-bottom: 3px solid #333; margin-bottom: 30px; padding-bottom: 15px; }
                    .report-title { font-size: 2.5rem; font-weight: bold; color: #333; margin-bottom: 10px; }
                    .report-subtitle { font-size: 1.2rem; color: #666; }
                    .basic-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .section { margin: 30px 0; }
                    .section-title { font-size: 1.4rem; font-weight: bold; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 8px; margin-bottom: 15px; }
                    .bazi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
                    .bazi-pillar { text-align: center; padding: 15px; border: 2px solid #ddd; border-radius: 8px; background: #f8f9fa; }
                    .pillar-label { font-weight: bold; color: #007bff; margin-bottom: 8px; }
                    .pillar-chars { font-size: 1.5rem; font-weight: bold; margin: 8px 0; }
                    .wuxing-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 15px 0; }
                    .wuxing-item { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
                    .name-suggestions { margin: 20px 0; }
                    .name-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #007bff; }
                    .name-title { font-size: 1.2rem; font-weight: bold; color: #333; margin-bottom: 8px; }
                    .name-score { color: #007bff; font-weight: bold; }
                    .ai-analysis { background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .report-footer { text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; color: #666; }
                    @media print {
                        body { margin: 0; padding: 15px; }
                        .report-container { padding: 0; }
                        .section { page-break-inside: avoid; }
                        .name-item { page-break-inside: avoid; }
                        .ai-analysis { page-break-inside: avoid; }
                    }
                    @page { margin: 2cm; size: A4; }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="report-header">
                        <div class="report-title">赛博起名</div>
                        <div class="report-subtitle">完整起名分析报告</div>
                    </div>

                    <div class="basic-info">
                        <strong>基本信息</strong><br>
                        姓名：${birthData.name}<br>
                        性别：${birthData.gender}<br>
                        出生时间：${birthData.year}年${birthData.month}月${birthData.day}日 ${birthData.hour.toString().padStart(2, '0')}:${(birthData.minute || 0).toString().padStart(2, '0')}<br>
                        出生地区：${birthData.birthProvince} ${birthData.birthCity}
                    </div>

                    <div class="section">
                        <div class="section-title">生辰八字</div>
                        <div class="bazi-grid">
                            <div class="bazi-pillar">
                                <div class="pillar-label">年柱</div>
                                <div class="pillar-chars">${baziResult.yearPillar}</div>
                                <div class="pillar-god">${baziResult.yearTenGod}</div>
                            </div>
                            <div class="bazi-pillar">
                                <div class="pillar-label">月柱</div>
                                <div class="pillar-chars">${baziResult.monthPillar}</div>
                                <div class="pillar-god">${baziResult.monthTenGod}</div>
                            </div>
                            <div class="bazi-pillar">
                                <div class="pillar-label">日柱</div>
                                <div class="pillar-chars">${baziResult.dayPillar}</div>
                                <div class="pillar-god">日主${baziResult.dayTianGan}</div>
                            </div>
                            <div class="bazi-pillar">
                                <div class="pillar-label">时柱</div>
                                <div class="pillar-chars">${baziResult.hourPillar}</div>
                                <div class="pillar-god">${baziResult.hourTenGod}</div>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">五行分析</div>
                        <div class="wuxing-stats">
                            ${this.generateWuXingStatsHTML(baziResult)}
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">AI综合排名前5</div>
                        <div class="name-suggestions">
                            ${rankedNames.length ? rankedNames.map((suggestion, index) => `
                                <div class="name-item">
                                    <div class="name-title">${index + 1}. ${suggestion.fullName} <span class="name-score">(${suggestion.aiScore}分)</span></div>
                                    <div><strong>推荐理由：</strong>${suggestion.reason}</div>
                                    ${suggestion.tradeoff ? `<div><strong>需要权衡：</strong>${suggestion.tradeoff}</div>` : ''}
                                    <div><strong>五行：</strong>${(suggestion.wuXingMatch || []).join('、') || '待考'}</div>
                                    <div><strong>出处：</strong>${suggestion.source?.work || '待考'}${suggestion.source?.section ? ` · ${suggestion.source.section}` : ''}</div>
                                    <div><strong>原文：</strong>“${suggestion.source?.quote || '暂无已核验引文'}”</div>
                                    ${this.getNamingCharacterSourceLines(suggestion).map((item) => `<div><strong>取字“${item.char}”：</strong>${item.sourceTitle}，见“${item.quote}”</div>`).join('')}
                                </div>
                            `).join('') : '<p>AI尚未返回可校验的前5排名，请等待分析完成后再生成报告。</p>'}
                        </div>
                    </div>

                    ${aiAnalysis ? `
                        <div class="section">
                            <div class="section-title">AI智能分析</div>
                            <div class="ai-analysis">
                                ${aiAnalysis}
                            </div>
                        </div>
                    ` : ''}

                    <div class="report-footer">
                        报告生成时间：${new Date().toLocaleString('zh-CN')}<br>
                        本报告由赛博起名系统生成
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // 生成五行统计HTML
    generateWuXingStatsHTML(baziResult) {
        const wuxingStats = this.getWuXingStats(baziResult);
        return Object.entries(wuxingStats).map(([element, count]) => `
            <div class="wuxing-item">
                <div style="font-weight: bold; color: #007bff;">${element}</div>
                <div>${count}个</div>
            </div>
        `).join('');
    }

    // 获取五行统计
    getWuXingStats(baziResult) {
        const stats = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };

        // 统计天干五行
        [baziResult.yearPillar[0], baziResult.monthPillar[0], baziResult.dayPillar[0], baziResult.hourPillar[0]].forEach(tianGan => {
            const wuxing = this.getTianGanWuXing(tianGan);
            if (stats[wuxing] !== undefined) stats[wuxing]++;
        });

        // 统计地支五行
        [baziResult.yearPillar[1], baziResult.monthPillar[1], baziResult.dayPillar[1], baziResult.hourPillar[1]].forEach(diZhi => {
            const wuxing = this.getDiZhiWuXing(diZhi);
            if (stats[wuxing] !== undefined) stats[wuxing]++;
        });

        return stats;
    }

    // 获取天干五行
    getTianGanWuXing(tianGan) {
        const wuxingMap = {
            '甲': '木', '乙': '木',
            '丙': '火', '丁': '火',
            '戊': '土', '己': '土',
            '庚': '金', '辛': '金',
            '壬': '水', '癸': '水'
        };
        return wuxingMap[tianGan] || '未知';
    }

    // 获取地支五行
    getDiZhiWuXing(diZhi) {
        const wuxingMap = {
            '子': '水', '亥': '水',
            '寅': '木', '卯': '木',
            '巳': '火', '午': '火',
            '申': '金', '酉': '金',
            '辰': '土', '戌': '土', '丑': '土', '未': '土'
        };
        return wuxingMap[diZhi] || '未知';
    }

    // ==================== 测名模块PDF生成 ====================

    // 下载测名PDF报告
    downloadCemingPDFReport(testData, nameAnalysis, baziResult) {
        const resultContent = document.querySelector('#ceming-result .result-content');
        if (!resultContent) {
            this.showError('没有可下载的报告内容');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            this.showError('报告窗口被浏览器拦截，请允许弹出窗口后重试');
            return;
        }

        this.showProcessing('正在准备PDF报告...');

        setTimeout(() => {
            this.hideProcessing();
            this.openCemingPrintPreview(testData, nameAnalysis, baziResult, printWindow);
        }, 500);
    }

    // 长图下载功能已移除，简化界面

    // 下载测名文本报告
    downloadCemingTextReport(testData, nameAnalysis, baziResult) {
        const resultContent = document.querySelector('#ceming-result .result-content');
        if (!resultContent) {
            this.showError('没有可下载的报告内容');
            return;
        }

        const reportText = this.generateCemingCompleteReport(testData, nameAnalysis, baziResult);

        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `赛博测名文本报告_${testData.fullName}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        this.showSuccess('文本报告已下载');
    }

    // 生成测名完整报告文本
    generateCemingCompleteReport(testData, nameAnalysis, baziResult) {
        let report = '';
        const aiScore = this.getCemingAIScoreResult();

        // 报告标题
        report += '赛博测名 - 完整姓名分析报告\n';
        report += '='.repeat(60) + '\n\n';

        // 基本信息
        report += `姓名：${testData.fullName}\n`;
        report += `性别：${testData.gender}\n`;
        report += `出生时间：${testData.year}年${testData.month}月${testData.day}日 ${testData.hour.toString().padStart(2, '0')}:${(testData.minute || 0).toString().padStart(2, '0')}\n`;
        report += `出生地区：${testData.birthProvince} ${testData.birthCity}\n\n`;

        // 八字信息
        report += '生辰八字\n';
        report += '-'.repeat(30) + '\n';
        report += `年柱：${baziResult.yearPillar} (${baziResult.yearTenGod})\n`;
        report += `月柱：${baziResult.monthPillar} (${baziResult.monthTenGod})\n`;
        report += `日柱：${baziResult.dayPillar} (日主${baziResult.dayTianGan})\n`;
        report += `时柱：${baziResult.hourPillar} (${baziResult.hourTenGod})\n\n`;

        // 姓名分析
        report += '姓名分析\n';
        report += '-'.repeat(30) + '\n';
        report += `AI综合评分：${aiScore ? `${aiScore.score}分` : '未完成'}\n`;
        report += `本地规则用于提供五格、三才、康熙笔画与五行等分析证据，不单独展示机械计算分。\n\n`;

        // 五格数理
        report += '五格数理：\n';
        report += `天格：${nameAnalysis.wuGe.tianGe}\n`;
        report += `人格：${nameAnalysis.wuGe.renGe}\n`;
        report += `地格：${nameAnalysis.wuGe.diGe}\n`;
        report += `外格：${nameAnalysis.wuGe.waiGe}\n`;
        report += `总格：${nameAnalysis.wuGe.zongGe}\n\n`;

        // 三才配置
        report += `三才配置：${nameAnalysis.sanCai.tianWuXing}${nameAnalysis.sanCai.renWuXing}${nameAnalysis.sanCai.diWuXing} (${nameAnalysis.sanCai.jiXiong})\n\n`;

        // 基础分析
        report += '基础分析\n';
        report += '-'.repeat(30) + '\n';
        report += nameAnalysis.analysis + '\n\n';

        // AI分析结果
        const aiOutput = document.getElementById('ceming-ai-output');
        if (aiOutput && aiOutput.textContent.trim()) {
            report += 'AI深度分析\n';
            report += '-'.repeat(30) + '\n';
            report += aiOutput.textContent.trim() + '\n\n';
        }

        // 报告尾部
        report += '-'.repeat(60) + '\n';
        report += `报告生成时间：${new Date().toLocaleString('zh-CN')}\n`;
        report += '本报告由赛博测名系统生成\n';

        return report;
    }

    // 打开测名打印预览
    openCemingPrintPreview(testData, nameAnalysis, baziResult, printWindow = null) {
        const reportHTML = this.generateCemingPrintableHTML(testData, nameAnalysis, baziResult);

        printWindow ||= window.open('', '_blank', 'width=800,height=600');
        if (!this.writePrintWindow(printWindow, reportHTML)) return;

        this.showSuccess('已打开打印预览，您可以选择"另存为PDF"保存');
    }

    // 生成测名报告HTML（用于长图生成）
    generateCemingReportHTML(testData, nameAnalysis, baziResult) {
        const aiOutput = document.getElementById('ceming-ai-output');
        const aiAnalysis = aiOutput ? aiOutput.innerHTML : '';
        const aiScore = this.getCemingAIScoreResult();

        return `
            <div style="width: 800px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%); color: white; padding: 40px; box-sizing: border-box; font-family: 'Microsoft YaHei', Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="font-size: 2.5rem; color: #00d4ff; margin-bottom: 10px; text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);">赛博测名</h1>
                    <h2 style="font-size: 1.2rem; color: #00ff88; margin: 0;">完整姓名分析报告</h2>
                </div>

                <div style="background: rgba(0, 212, 255, 0.1); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(0, 212, 255, 0.3);">
                    <h3 style="color: #00d4ff; margin-bottom: 15px; font-size: 1.3rem;">基本信息</h3>
                    <div style="line-height: 1.8; font-size: 1.1rem;">
                        <div><strong style="color: #00ff88;">姓名：</strong>${testData.fullName}</div>
                        <div><strong style="color: #00ff88;">性别：</strong>${testData.gender}</div>
                        <div><strong style="color: #00ff88;">出生时间：</strong>${testData.year}年${testData.month}月${testData.day}日 ${testData.hour.toString().padStart(2, '0')}:${(testData.minute || 0).toString().padStart(2, '0')}</div>
                        <div><strong style="color: #00ff88;">出生地区：</strong>${testData.birthProvince} ${testData.birthCity}</div>
                    </div>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; width: 150px; height: 150px; border: 4px solid #00d4ff; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0, 212, 255, 0.1);">
                        <div style="font-size: 3rem; font-weight: bold; color: #00d4ff;">${aiScore ? aiScore.score : '--'}</div>
                        <div style="font-size: 1.2rem; color: #00ff88;">AI综合分</div>
                    </div>
                </div>

                <div style="background: rgba(0, 255, 136, 0.1); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(0, 255, 136, 0.3);">
                    <h3 style="color: #00ff88; margin-bottom: 20px; font-size: 1.3rem;">生辰八字</h3>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
                        <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(0, 212, 255, 0.3);">
                            <div style="color: #00d4ff; font-weight: bold; margin-bottom: 8px;">年柱</div>
                            <div style="font-size: 1.3rem; font-weight: bold; margin: 8px 0;">${baziResult.yearPillar}</div>
                            <div style="color: #00ff88; font-size: 0.9rem;">${baziResult.yearTenGod}</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(0, 212, 255, 0.3);">
                            <div style="color: #00d4ff; font-weight: bold; margin-bottom: 8px;">月柱</div>
                            <div style="font-size: 1.3rem; font-weight: bold; margin: 8px 0;">${baziResult.monthPillar}</div>
                            <div style="color: #00ff88; font-size: 0.9rem;">${baziResult.monthTenGod}</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(0, 212, 255, 0.3);">
                            <div style="color: #00d4ff; font-weight: bold; margin-bottom: 8px;">日柱</div>
                            <div style="font-size: 1.3rem; font-weight: bold; margin: 8px 0;">${baziResult.dayPillar}</div>
                            <div style="color: #00ff88; font-size: 0.9rem;">日主${baziResult.dayTianGan}</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(0, 212, 255, 0.3);">
                            <div style="color: #00d4ff; font-weight: bold; margin-bottom: 8px;">时柱</div>
                            <div style="font-size: 1.3rem; font-weight: bold; margin: 8px 0;">${baziResult.hourPillar}</div>
                            <div style="color: #00ff88; font-size: 0.9rem;">${baziResult.hourTenGod}</div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(255, 0, 128, 0.1); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(255, 0, 128, 0.3);">
                    <h3 style="color: #ff0080; margin-bottom: 20px; font-size: 1.3rem;">五格数理</h3>
                    <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px;">
                        <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(255, 0, 128, 0.3);">
                            <div style="color: #ff0080; font-weight: bold; margin-bottom: 8px;">天格</div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #00d4ff;">${nameAnalysis.wuGe.tianGe}</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(255, 0, 128, 0.3);">
                            <div style="color: #ff0080; font-weight: bold; margin-bottom: 8px;">人格</div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #00d4ff;">${nameAnalysis.wuGe.renGe}</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(255, 0, 128, 0.3);">
                            <div style="color: #ff0080; font-weight: bold; margin-bottom: 8px;">地格</div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #00d4ff;">${nameAnalysis.wuGe.diGe}</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(255, 0, 128, 0.3);">
                            <div style="color: #ff0080; font-weight: bold; margin-bottom: 8px;">外格</div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #00d4ff;">${nameAnalysis.wuGe.waiGe}</div>
                        </div>
                        <div style="text-align: center; padding: 15px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(255, 0, 128, 0.3);">
                            <div style="color: #ff0080; font-weight: bold; margin-bottom: 8px;">总格</div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: #00d4ff;">${nameAnalysis.wuGe.zongGe}</div>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(0, 212, 255, 0.1); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(0, 212, 255, 0.3);">
                    <h3 style="color: #00d4ff; margin-bottom: 15px; font-size: 1.3rem;">三才配置</h3>
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: #00ff88; margin-bottom: 10px;">
                            ${nameAnalysis.sanCai.tianWuXing}${nameAnalysis.sanCai.renWuXing}${nameAnalysis.sanCai.diWuXing}
                        </div>
                        <div style="color: #00d4ff; font-size: 1.1rem;">(${nameAnalysis.sanCai.jiXiong})</div>
                    </div>
                </div>

                <div style="background: rgba(0, 255, 136, 0.1); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(0, 255, 136, 0.3);">
                    <h3 style="color: #00ff88; margin-bottom: 20px; font-size: 1.3rem;">基础分析</h3>
                    <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 8px; line-height: 1.8; white-space: pre-wrap;">
                        ${nameAnalysis.analysis}
                    </div>
                </div>

                ${aiAnalysis ? `
                    <div style="background: rgba(255, 0, 128, 0.1); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(255, 0, 128, 0.3);">
                        <h3 style="color: #ff0080; margin-bottom: 20px; font-size: 1.3rem;">AI智能分析</h3>
                        <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 8px; line-height: 1.8;">
                            ${aiAnalysis}
                        </div>
                    </div>
                ` : ''}

                <div style="text-align: center; margin-top: 40px; padding: 25px; background: rgba(0, 0, 0, 0.3); border-radius: 12px; border-top: 2px solid #00d4ff; color: #ccc;">
                    报告生成时间：${new Date().toLocaleString('zh-CN')}<br>
                    本报告由赛博测名系统生成
                </div>
            </div>
        `;
    }

    // 生成测名可打印HTML
    generateCemingPrintableHTML(testData, nameAnalysis, baziResult) {
        const aiOutput = document.getElementById('ceming-ai-output');
        const aiAnalysis = aiOutput ? aiOutput.innerHTML : '';
        const aiScore = this.getCemingAIScoreResult();

        return `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>赛博测名报告</title>
                <link rel="stylesheet" href="css/print.css">
                <style>
                    body { font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .report-container { max-width: 800px; margin: 0 auto; padding: 20px; }
                    .report-header { text-align: center; border-bottom: 3px solid #333; margin-bottom: 30px; padding-bottom: 15px; }
                    .report-title { font-size: 2.5rem; font-weight: bold; color: #333; margin-bottom: 10px; }
                    .report-subtitle { font-size: 1.2rem; color: #666; }
                    .basic-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .section { margin: 30px 0; }
                    .section-title { font-size: 1.4rem; font-weight: bold; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 8px; margin-bottom: 15px; }
                    .score-display { text-align: center; margin: 20px 0; }
                    .score-circle { display: inline-block; width: 120px; height: 120px; border: 4px solid #007bff; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                    .score-number { font-size: 2.5rem; font-weight: bold; color: #007bff; }
                    .score-label { font-size: 1rem; color: #666; }
                    .bazi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
                    .bazi-pillar { text-align: center; padding: 15px; border: 2px solid #ddd; border-radius: 8px; background: #f8f9fa; }
                    .pillar-label { font-weight: bold; color: #007bff; margin-bottom: 8px; }
                    .pillar-chars { font-size: 1.5rem; font-weight: bold; margin: 8px 0; }
                    .wuge-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 15px 0; }
                    .wuge-item { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background: #f8f9fa; }
                    .wuge-label { font-weight: bold; color: #007bff; }
                    .wuge-value { font-size: 1.2rem; font-weight: bold; margin-top: 5px; }
                    .sancai-info { background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
                    .analysis-text { background: #f8f9fa; padding: 15px; border-radius: 8px; white-space: pre-wrap; }
                    .ai-analysis { background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .report-footer { text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px; color: #666; }
                    @media print {
                        body { margin: 0; padding: 15px; }
                        .report-container { padding: 0; }
                        .section { page-break-inside: avoid; }
                        .score-display { page-break-inside: avoid; }
                        .ai-analysis { page-break-inside: avoid; }
                    }
                    @page { margin: 2cm; size: A4; }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <div class="report-header">
                        <div class="report-title">赛博测名</div>
                        <div class="report-subtitle">完整姓名分析报告</div>
                    </div>

                    <div class="basic-info">
                        <strong>基本信息</strong><br>
                        姓名：${testData.fullName}<br>
                        性别：${testData.gender}<br>
                        出生时间：${testData.year}年${testData.month}月${testData.day}日 ${testData.hour.toString().padStart(2, '0')}:${(testData.minute || 0).toString().padStart(2, '0')}<br>
                        出生地区：${testData.birthProvince} ${testData.birthCity}
                    </div>

                    <div class="section">
                        <div class="section-title">AI综合评分</div>
                        <div class="score-display">
                            <div class="score-circle">
                                <div class="score-number">${aiScore ? aiScore.score : '--'}</div>
                                <div class="score-label">AI综合分</div>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">生辰八字</div>
                        <div class="bazi-grid">
                            <div class="bazi-pillar">
                                <div class="pillar-label">年柱</div>
                                <div class="pillar-chars">${baziResult.yearPillar}</div>
                                <div class="pillar-god">${baziResult.yearTenGod}</div>
                            </div>
                            <div class="bazi-pillar">
                                <div class="pillar-label">月柱</div>
                                <div class="pillar-chars">${baziResult.monthPillar}</div>
                                <div class="pillar-god">${baziResult.monthTenGod}</div>
                            </div>
                            <div class="bazi-pillar">
                                <div class="pillar-label">日柱</div>
                                <div class="pillar-chars">${baziResult.dayPillar}</div>
                                <div class="pillar-god">日主${baziResult.dayTianGan}</div>
                            </div>
                            <div class="bazi-pillar">
                                <div class="pillar-label">时柱</div>
                                <div class="pillar-chars">${baziResult.hourPillar}</div>
                                <div class="pillar-god">${baziResult.hourTenGod}</div>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">五格数理</div>
                        <div class="wuge-grid">
                            <div class="wuge-item">
                                <div class="wuge-label">天格</div>
                                <div class="wuge-value">${nameAnalysis.wuGe.tianGe}</div>
                            </div>
                            <div class="wuge-item">
                                <div class="wuge-label">人格</div>
                                <div class="wuge-value">${nameAnalysis.wuGe.renGe}</div>
                            </div>
                            <div class="wuge-item">
                                <div class="wuge-label">地格</div>
                                <div class="wuge-value">${nameAnalysis.wuGe.diGe}</div>
                            </div>
                            <div class="wuge-item">
                                <div class="wuge-label">外格</div>
                                <div class="wuge-value">${nameAnalysis.wuGe.waiGe}</div>
                            </div>
                            <div class="wuge-item">
                                <div class="wuge-label">总格</div>
                                <div class="wuge-value">${nameAnalysis.wuGe.zongGe}</div>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">三才配置</div>
                        <div class="sancai-info">
                            <strong>${nameAnalysis.sanCai.tianWuXing}${nameAnalysis.sanCai.renWuXing}${nameAnalysis.sanCai.diWuXing}</strong> (${nameAnalysis.sanCai.jiXiong})
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">基础分析</div>
                        <div class="analysis-text">${nameAnalysis.analysis}</div>
                    </div>

                    ${aiAnalysis ? `
                        <div class="section">
                            <div class="section-title">AI智能分析</div>
                            <div class="ai-analysis">
                                ${aiAnalysis}
                            </div>
                        </div>
                    ` : ''}

                    <div class="report-footer">
                        报告生成时间：${new Date().toLocaleString('zh-CN')}<br>
                        本报告由赛博测名系统生成
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // ==================== 合婚模块PDF生成 ====================

    // 下载合婚PDF报告
    downloadMarriagePDFReport(marriageData, marriageResult) {
        const resultContent = document.querySelector('#hehun-result .result-content');
        if (!resultContent) {
            this.showError('没有可下载的报告内容');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            this.showError('报告窗口被浏览器拦截，请允许弹出窗口后重试');
            return;
        }

        this.showProcessing('正在准备PDF报告...');

        setTimeout(() => {
            this.hideProcessing();
            this.openMarriagePrintPreview(marriageData, marriageResult, printWindow);
        }, 500);
    }

    // 长图下载功能已移除，简化界面

    // 下载合婚文本报告
    downloadMarriageTextReport(marriageData, marriageResult) {
        const resultContent = document.querySelector('#hehun-result .result-content');
        if (!resultContent) {
            this.showError('没有可下载的报告内容');
            return;
        }

        const reportText = this.generateMarriageCompleteReport(marriageData, marriageResult);

        const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `赛博合婚文本报告_${marriageData.male.name}_${marriageData.female.name}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        this.showSuccess('文本报告已下载');
    }

    // 生成合婚完整报告文本
    generateMarriageCompleteReport(marriageData, marriageResult) {
        let report = '';
        const aiScore = this.getMarriageAIScoreResult();

        // 报告标题
        report += '赛博合婚 - 完整合婚分析报告\n';
        report += '='.repeat(60) + '\n\n';

        // 基本信息
        report += `男方：${marriageData.male.name}\n`;
        report += `出生时间：${marriageData.male.year}年${marriageData.male.month}月${marriageData.male.day}日 ${marriageData.male.hour.toString().padStart(2, '0')}:${(marriageData.male.minute || 0).toString().padStart(2, '0')}\n`;
        report += `出生地区：${marriageData.male.birthProvince || '未知'} ${marriageData.male.birthCity || '未知'}\n`;
        report += `生肖：${this.getZodiacAnimal(marriageData.male.year)}\n\n`;

        report += `女方：${marriageData.female.name}\n`;
        report += `出生时间：${marriageData.female.year}年${marriageData.female.month}月${marriageData.female.day}日 ${marriageData.female.hour.toString().padStart(2, '0')}:${(marriageData.female.minute || 0).toString().padStart(2, '0')}\n`;
        report += `出生地区：${marriageData.female.birthProvince || '未知'} ${marriageData.female.birthCity || '未知'}\n`;
        report += `生肖：${this.getZodiacAnimal(marriageData.female.year)}\n\n`;

        // 合婚分析
        report += '合婚分析\n';
        report += '-'.repeat(30) + '\n';
        report += `AI综合评分：${aiScore ? `${aiScore.score}分` : '尚未生成'}\n`;
        if (aiScore?.confidence) report += `AI判断可信度：${aiScore.confidence}\n`;
        if (aiScore?.summary) report += `AI综合结论：${aiScore.summary}\n`;
        report += '本地规则仅作为分析证据，不代表最终结论。\n\n';

        report += '本地规则证据：生肖配对\n';
        report += `${marriageResult.shengXiaoMatch.analysis}\n\n`;

        report += '本地规则证据：五行配对\n';
        report += `${marriageResult.wuXingMatch.analysis}\n\n`;

        report += '本地规则证据：十神配对\n';
        report += `${marriageResult.shiShenMatch.analysis}\n\n`;

        report += '本地规则证据：年龄差\n';
        report += `${marriageResult.ageMatch.analysis}\n\n`;

        // AI分析结果
        const aiOutput = document.getElementById('ai-marriage-output');
        if (aiOutput && aiOutput.textContent.trim()) {
            report += 'AI深度分析\n';
            report += '-'.repeat(30) + '\n';
            report += aiOutput.textContent.trim() + '\n\n';
        }

        // 报告尾部
        report += '-'.repeat(60) + '\n';
        report += `报告生成时间：${new Date().toLocaleString('zh-CN')}\n`;
        report += '本报告由赛博合婚系统生成\n';

        return report;
    }

    // 打开合婚打印预览
    openMarriagePrintPreview(marriageData, marriageResult, printWindow = null) {
        const reportHTML = this.generateMarriagePrintableHTML(marriageData, marriageResult);

        printWindow ||= window.open('', '_blank', 'width=800,height=600');
        if (!this.writePrintWindow(printWindow, reportHTML)) return;

        this.showSuccess('已打开打印预览，您可以选择"另存为PDF"保存');
    }

    // 生成合婚报告HTML（用于长图生成）
    generateMarriagePrintableHTML(marriageData, marriageResult) {
        const aiOutput = document.getElementById('ai-marriage-output');
        const aiAnalysis = aiOutput ? aiOutput.innerHTML : '';
        const aiScore = this.getMarriageAIScoreResult();

        return `
            <div style="width: 800px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%); color: white; padding: 40px; box-sizing: border-box; font-family: 'Microsoft YaHei', Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 style="font-size: 2.5rem; color: #00d4ff; margin-bottom: 10px; text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);">赛博合婚</h1>
                    <h2 style="font-size: 1.2rem; color: #00ff88; margin: 0;">完整合婚分析报告</h2>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
                    <div style="background: rgba(0, 212, 255, 0.1); padding: 25px; border-radius: 12px; border: 1px solid rgba(0, 212, 255, 0.3);">
                        <h3 style="color: #00d4ff; margin-bottom: 15px; font-size: 1.3rem; text-align: center;">👨 男方信息</h3>
                        <div style="line-height: 1.8; font-size: 1rem;">
                            <div><strong style="color: #00ff88;">姓名：</strong>${marriageData.male.name}</div>
                            <div><strong style="color: #00ff88;">出生：</strong>${marriageData.male.year}年${marriageData.male.month}月${marriageData.male.day}日</div>
                            <div><strong style="color: #00ff88;">时间：</strong>${marriageData.male.hour.toString().padStart(2, '0')}:${(marriageData.male.minute || 0).toString().padStart(2, '0')}</div>
                            <div><strong style="color: #00ff88;">地区：</strong>${marriageData.male.birthProvince || '未知'} ${marriageData.male.birthCity || '未知'}</div>
                            <div><strong style="color: #00ff88;">生肖：</strong>${this.getZodiacAnimal(marriageData.male.year)}</div>
                        </div>
                    </div>
                    <div style="background: rgba(255, 0, 128, 0.1); padding: 25px; border-radius: 12px; border: 1px solid rgba(255, 0, 128, 0.3);">
                        <h3 style="color: #ff0080; margin-bottom: 15px; font-size: 1.3rem; text-align: center;">👩 女方信息</h3>
                        <div style="line-height: 1.8; font-size: 1rem;">
                            <div><strong style="color: #00ff88;">姓名：</strong>${marriageData.female.name}</div>
                            <div><strong style="color: #00ff88;">出生：</strong>${marriageData.female.year}年${marriageData.female.month}月${marriageData.female.day}日</div>
                            <div><strong style="color: #00ff88;">时间：</strong>${marriageData.female.hour.toString().padStart(2, '0')}:${(marriageData.female.minute || 0).toString().padStart(2, '0')}</div>
                            <div><strong style="color: #00ff88;">地区：</strong>${marriageData.female.birthProvince || '未知'} ${marriageData.female.birthCity || '未知'}</div>
                            <div><strong style="color: #00ff88;">生肖：</strong>${this.getZodiacAnimal(marriageData.female.year)}</div>
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <div style="display: inline-block; width: 150px; height: 150px; border: 4px solid #00d4ff; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0, 212, 255, 0.1);">
                        <div style="font-size: 2.5rem; font-weight: bold; color: #00d4ff;">${aiScore ? aiScore.score : '--'}</div>
                        <div style="font-size: 1rem; color: #00ff88;">${aiScore ? 'AI综合分' : '待AI判断'}</div>
                        <div style="font-size: 0.9rem; color: #ff0080; margin-top: 5px;">${aiScore?.summary || '本地规则仅供参考'}</div>
                    </div>
                </div>

                <div style="background: rgba(0, 255, 136, 0.1); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(0, 255, 136, 0.3);">
                    <h3 style="color: #00ff88; margin-bottom: 20px; font-size: 1.3rem;">合婚分析详情</h3>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; border-left: 4px solid #00d4ff;">
                            <div style="color: #00d4ff; font-weight: bold; margin-bottom: 8px;">生肖配对</div>
                            <div style="font-size: 0.9rem; line-height: 1.5;">${marriageResult.shengXiaoMatch.analysis}</div>
                        </div>
                        <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; border-left: 4px solid #ff0080;">
                            <div style="color: #ff0080; font-weight: bold; margin-bottom: 8px;">五行配对</div>
                            <div style="font-size: 0.9rem; line-height: 1.5;">${marriageResult.wuXingMatch.analysis}</div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; border-left: 4px solid #00ff88;">
                            <div style="color: #00ff88; font-weight: bold; margin-bottom: 8px;">十神配对</div>
                            <div style="font-size: 0.9rem; line-height: 1.5;">${marriageResult.shiShenMatch.analysis}</div>
                        </div>
                        <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 8px; border-left: 4px solid #ffa500;">
                            <div style="color: #ffa500; font-weight: bold; margin-bottom: 8px;">年龄配对</div>
                            <div style="font-size: 0.9rem; line-height: 1.5;">${marriageResult.ageMatch.analysis}</div>
                        </div>
                    </div>
                </div>

                ${aiAnalysis ? `
                    <div style="background: rgba(0, 212, 255, 0.1); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid rgba(0, 212, 255, 0.3);">
                        <h3 style="color: #00d4ff; margin-bottom: 20px; font-size: 1.3rem;">AI智能分析</h3>
                        <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; border-radius: 8px; line-height: 1.8;">
                            ${aiAnalysis}
                        </div>
                    </div>
                ` : ''}

                <div style="text-align: center; margin-top: 40px; padding: 25px; background: rgba(0, 0, 0, 0.3); border-radius: 12px; border-top: 2px solid #00d4ff; color: #ccc;">
                    报告生成时间：${new Date().toLocaleString('zh-CN')}<br>
                    本报告由赛博合婚系统生成
                </div>
            </div>
        `;
    }

    // 获取生肖动物
    getZodiacAnimal(year) {
        const animals = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'];
        return animals[(year - 4) % 12];
    }

    // 长图截取功能已移除，简化代码
}

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing CyberFortune...');
    try {
        window.cyberFortune = new CyberFortune();
        console.log('CyberFortune initialized successfully');

        // 额外的延迟检查，确保在所有环境下都能正常工作
        setTimeout(() => {
            console.log('Performing final check of select elements...');
            if (window.cyberFortune && typeof window.cyberFortune.ensureSelectsPopulated === 'function') {
                window.cyberFortune.ensureSelectsPopulated();
            }
        }, 1000);

    } catch (error) {
        console.error('Error initializing CyberFortune:', error);
    }
});

// 备用初始化（防止DOMContentLoaded事件失效）
window.addEventListener('load', function() {
    console.log('Window loaded, checking CyberFortune initialization...');
    if (!window.cyberFortune) {
        console.log('CyberFortune not initialized, trying again...');
        try {
            window.cyberFortune = new CyberFortune();
            console.log('CyberFortune initialized on window load');
        } catch (error) {
            console.error('Error initializing CyberFortune on window load:', error);
        }
    } else {
        console.log('CyberFortune already initialized');
        // 再次确保选择框已填充
        if (typeof window.cyberFortune.ensureSelectsPopulated === 'function') {
            window.cyberFortune.ensureSelectsPopulated();
        }
    }
});
