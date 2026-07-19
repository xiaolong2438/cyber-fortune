// 表单辅助：最近出生资料复用、内联校验与无障碍标签补全。
(function (root) {
    class FormAssistant {
        static STORAGE_KEY = 'cyberFortune_recentBirthProfile';

        static STORAGE_TIMESTAMP_KEY = 'cyberFortune_recentBirthProfile_savedAt';

        static MAX_PROFILE_AGE = 30 * 24 * 60 * 60 * 1000;

        static PROFILE_FIELDS = [
            'gender', 'year', 'month', 'day', 'hour', 'minute', 'birthProvince', 'birthCity'
        ];

        static FIELD_LABELS = {
            surname: '姓氏', fullName: '姓名', gender: '性别',
            birthYear: '出生年份', birthMonth: '出生月份', birthDay: '出生日期',
            birthHour: '出生小时', birthMinute: '出生分钟',
            birthProvince: '出生省份', birthCity: '出生城市',
            maleName: '男方姓名', femaleName: '女方姓名',
            maleBirthYear: '男方出生年份', maleBirthMonth: '男方出生月份', maleBirthDay: '男方出生日期',
            maleBirthHour: '男方出生小时', maleBirthMinute: '男方出生分钟',
            maleBirthProvince: '男方出生省份', maleBirthCity: '男方出生城市',
            femaleBirthYear: '女方出生年份', femaleBirthMonth: '女方出生月份', femaleBirthDay: '女方出生日期',
            femaleBirthHour: '女方出生小时', femaleBirthMinute: '女方出生分钟',
            femaleBirthProvince: '女方出生省份', femaleBirthCity: '女方出生城市',
            firstChar: '指定第一个字', secondChar: '指定第二个字', candidateChars: '候选字库'
        };

        constructor(options = {}) {
            this.storage = options.storage !== undefined ? options.storage : FormAssistant.getDefaultStorage();
            this.forms = options.forms || Array.from(root.document?.querySelectorAll('.cyber-form') || []);
        }

        static getDefaultStorage() {
            try {
                return root.localStorage;
            } catch (error) {
                return null;
            }
        }

        static sanitizeProfile(data = {}) {
            const profile = {};
            FormAssistant.PROFILE_FIELDS.forEach((field) => {
                if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
                    profile[field] = data[field];
                }
            });
            return profile;
        }

        static escapeHTML(value) {
            return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
            })[character]);
        }

        static saveRecent(data, storage = FormAssistant.getDefaultStorage()) {
            if (!storage) return null;
            const profile = FormAssistant.sanitizeProfile(data);
            if (!profile.year || !profile.month || !profile.day) return null;
            try {
                storage.setItem(FormAssistant.STORAGE_KEY, JSON.stringify(profile));
                storage.setItem(FormAssistant.STORAGE_TIMESTAMP_KEY, String(Date.now()));
                return profile;
            } catch (error) {
                return null;
            }
        }

        static loadRecent(storage = FormAssistant.getDefaultStorage()) {
            if (!storage) return null;
            try {
                const savedAt = Number(storage.getItem(FormAssistant.STORAGE_TIMESTAMP_KEY));
                if (savedAt && Date.now() - savedAt > FormAssistant.MAX_PROFILE_AGE) {
                    FormAssistant.clearRecent(storage);
                    return null;
                }
                const parsed = JSON.parse(storage.getItem(FormAssistant.STORAGE_KEY) || 'null');
                if (!parsed || typeof parsed !== 'object') return null;
                const profile = FormAssistant.sanitizeProfile(parsed);
                if (!profile.year || !profile.month || !profile.day) return null;
                if (!savedAt) {
                    try {
                        storage.setItem(FormAssistant.STORAGE_TIMESTAMP_KEY, String(Date.now()));
                    } catch (error) {
                        // 旧数据仍可在本次会话中使用。
                    }
                }
                return profile;
            } catch (error) {
                return null;
            }
        }

        static clearRecent(storage = FormAssistant.getDefaultStorage()) {
            if (!storage) return false;
            try {
                storage.removeItem(FormAssistant.STORAGE_KEY);
                storage.removeItem(FormAssistant.STORAGE_TIMESTAMP_KEY);
                return true;
            } catch (error) {
                return false;
            }
        }

        init() {
            this.forms.forEach((form) => this.enhanceForm(form));
            return this;
        }

        enhanceForm(form) {
            form.noValidate = true;
            this.connectLabels(form);

            form.querySelectorAll('[data-reuse-profile]').forEach((button) => {
                button.addEventListener('click', () => {
                    this.fillRecent(form, button.dataset.profileTarget || 'single');
                });
            });

            form.querySelectorAll('[data-clear-profile]').forEach((button) => {
                button.addEventListener('click', () => {
                    const cleared = FormAssistant.clearRecent(this.storage);
                    this.showFeedback(form, cleared ? '最近出生资料已从当前浏览器清除。' : '当前没有可清除的资料。', cleared ? 'success' : 'info');
                });
            });

            form.addEventListener('input', (event) => this.clearFieldError(event.target, form));
            form.addEventListener('change', (event) => this.clearFieldError(event.target, form));
        }

        connectLabels(form) {
            form.querySelectorAll('.form-group').forEach((group, groupIndex) => {
                const label = group.querySelector(':scope > label:not([for])');
                const control = group.querySelector('input:not([type="radio"]), select, textarea');
                if (!label || !control) return;
                if (!control.id) control.id = `${form.id}-field-${groupIndex + 1}`;
                label.htmlFor = control.id;
            });

            form.querySelectorAll('input, select, textarea').forEach((field) => {
                const hasAccessibleLabel = field.getAttribute('aria-label') ||
                    field.getAttribute('aria-labelledby') || field.labels?.length;
                if (!hasAccessibleLabel && FormAssistant.FIELD_LABELS[field.name]) {
                    field.setAttribute('aria-label', FormAssistant.FIELD_LABELS[field.name]);
                }
            });
        }

        validate(form) {
            const invalid = [];
            form.querySelectorAll('[required]').forEach((field) => {
                const isRadio = field.type === 'radio';
                const valid = isRadio
                    ? Boolean(form.querySelector(`input[name="${field.name}"]:checked`))
                    : Boolean(String(field.value || '').trim()) && field.checkValidity();

                if (!valid && !invalid.some((item) => item.name === field.name)) {
                    invalid.push(field);
                }
            });

            form.querySelectorAll('.is-invalid').forEach((field) => {
                field.classList.remove('is-invalid');
                field.removeAttribute('aria-invalid');
            });

            if (!invalid.length) {
                this.showFeedback(form, '', 'success');
                return true;
            }

            invalid.forEach((field) => {
                field.classList.add('is-invalid');
                field.setAttribute('aria-invalid', 'true');
            });

            const labels = invalid.map((field) => FormAssistant.FIELD_LABELS[field.name] || '必填信息');
            this.showFeedback(form, `请补充：${labels.join('、')}`, 'error');
            invalid[0].focus({ preventScroll: true });
            invalid[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }

        clearFieldError(field, form) {
            if (!field?.matches?.('input, select, textarea')) return;
            if (field.value || (field.type === 'radio' && field.checked)) {
                field.classList.remove('is-invalid');
                field.removeAttribute('aria-invalid');
            }
            if (!form.querySelector('.is-invalid')) this.showFeedback(form, '', 'info');
        }

        showFeedback(form, message, type = 'info') {
            const feedback = form.querySelector('.form-feedback');
            if (!feedback) return;
            feedback.textContent = message;
            feedback.dataset.type = type;
            feedback.hidden = !message;
        }

        fillRecent(form, target = 'single') {
            const profile = FormAssistant.loadRecent(this.storage);
            if (!profile) {
                this.showFeedback(form, '还没有可复用的出生资料，完成一次分析后即可使用。', 'info');
                return false;
            }

            const prefix = target === 'male' ? 'male' : target === 'female' ? 'female' : '';
            const fieldName = (suffix) => prefix ? `${prefix}Birth${suffix}` : `birth${suffix}`;
            const values = [
                [fieldName('Year'), profile.year],
                [fieldName('Month'), profile.month],
                [fieldName('Day'), profile.day],
                [fieldName('Hour'), profile.hour],
                [fieldName('Minute'), profile.minute],
                [fieldName('Province'), profile.birthProvince],
                [fieldName('City'), profile.birthCity]
            ];

            if (!prefix && profile.gender) {
                const gender = form.querySelector(`input[name="gender"][value="${profile.gender}"]`);
                if (gender) {
                    gender.checked = true;
                    gender.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            values.forEach(([name, value]) => {
                if (value === undefined || value === null) return;
                const field = form.elements[name];
                if (!field) return;
                field.value = String(value);
                field.dispatchEvent(new Event('change', { bubbles: true }));
            });

            const subject = target === 'male' ? '男方' : target === 'female' ? '女方' : '当前表单';
            this.showFeedback(form, `已将最近出生资料填入${subject}，请核对后提交。`, 'success');
            return true;
        }
    }

    root.FormAssistant = FormAssistant;
})(typeof window !== 'undefined' ? window : globalThis);
