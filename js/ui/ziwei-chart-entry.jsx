import React from 'react';
import { createRoot } from 'react-dom/client';
import { Iztrolabe } from 'react-iztro';
import html2canvas from 'html2canvas';

window.html2canvas = html2canvas;

const chartRoots = new WeakMap();
const chartObservers = new WeakMap();
const interactiveSelector = '.center-button, .solar-horoscope .today, .iztro-palace-fate span, .iztro-palace-gz, .iztro-palace-name';

export function birthHourToIndex(value) {
    const hour = Number(value);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
    return hour === 23 ? 12 : Math.floor((hour + 1) / 2);
}

function normalizeBirthData(birthData = {}) {
    const year = Number(birthData.year);
    const month = Number(birthData.month);
    const day = Number(birthData.day);
    const birthTime = birthHourToIndex(birthData.hour);
    const gender = birthData.gender === '男' || birthData.gender === 'male' ? 'male' :
        birthData.gender === '女' || birthData.gender === 'female' ? 'female' : null;
    const date = new Date(Date.UTC(year, month - 1, day));
    const validDate = Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day) &&
        date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;

    if (!validDate || birthTime === null || !gender) {
        return { valid: false, error: '出生日期、时辰或性别不完整，无法绘制互动星盘。' };
    }

    return {
        valid: true,
        value: {
            birthday: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            birthTime,
            birthdayType: 'solar',
            gender,
            fixLeap: true,
            lang: 'zh-CN',
            centerPalaceAlign: true,
            horoscopeDate: new Date()
        }
    };
}

class ZiweiChartErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error) {
        this.props.onError?.(error);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="ziwei-chart-error" role="alert">
                    <strong>互动星盘暂时无法显示</strong>
                    <span>下方十二宫概览和命盘分析仍可正常使用。</span>
                </div>
            );
        }
        return this.props.children;
    }
}

function enhanceInteractiveControls(element) {
    element.querySelectorAll(interactiveSelector).forEach((control) => {
        const disabled = control.classList.contains('disabled');
        control.setAttribute('role', 'button');
        control.setAttribute('tabindex', disabled ? '-1' : '0');
        control.setAttribute('aria-disabled', String(disabled));
        if (!control.getAttribute('aria-label')) {
            control.setAttribute('aria-label', control.textContent.trim() || '星盘交互项');
        }
    });

    if (element.dataset.keyboardEnhanced !== 'true') {
        element.dataset.keyboardEnhanced = 'true';
        element.addEventListener('keydown', (event) => {
            const control = event.target.closest(interactiveSelector);
            if (!control || control.classList.contains('disabled')) return;
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                control.click();
            }
        });
    }
}

function mount(element, birthData, options = {}) {
    if (!(element instanceof Element)) {
        return { ok: false, error: '找不到互动星盘容器。' };
    }

    // A mount is a full replacement. Starting with a fresh root also resets a
    // previously tripped error boundary and keeps observers in sync.
    unmount(element);
    const normalized = normalizeBirthData(birthData);
    if (!normalized.valid) {
        element.dataset.state = 'error';
        element.textContent = normalized.error;
        element.setAttribute('role', 'alert');
        return { ok: false, error: normalized.error };
    }

    element.textContent = '';
    element.removeAttribute('role');
    const root = createRoot(element);
    chartRoots.set(element, root);

    element.dataset.state = 'rendering';
    root.render(
        <ZiweiChartErrorBoundary onError={options.onError}>
            <Iztrolabe {...normalized.value} />
        </ZiweiChartErrorBoundary>
    );
    requestAnimationFrame(() => {
        if (!element.isConnected || chartRoots.get(element) !== root) return;
        enhanceInteractiveControls(element);
        element.dataset.state = 'ready';

        if (!chartObservers.has(element)) {
            const observer = new MutationObserver(() => enhanceInteractiveControls(element));
            observer.observe(element, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
            chartObservers.set(element, observer);
        }
    });
    return { ok: true, props: normalized.value };
}

function unmount(element) {
    const root = chartRoots.get(element);
    if (!root) return false;
    root.unmount();
    chartObservers.get(element)?.disconnect();
    chartObservers.delete(element);
    chartRoots.delete(element);
    return true;
}

window.ZiweiChart = Object.freeze({ mount, unmount, birthHourToIndex });
