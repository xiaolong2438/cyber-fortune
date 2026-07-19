// 赛博论命 - 紫薇斗数计算模块（基于iztro库）

class ZiweiCalculator {
    constructor() {
        // 检查iztro库是否可用
        this.iztroAvailable = typeof iztro !== 'undefined' && typeof iztro.astro?.bySolar === 'function';
        if (this.iztroAvailable) {
            console.log('✅ iztro库已加载，将使用专业紫薇斗数计算');
        } else {
            console.error('iztro库未加载，紫微斗数计算将明确标记为不可用');
        }
        
        // 十二宫位
        this.gongWei = [
            '命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫',
            '迁移宫', '奴仆宫', '官禄宫', '田宅宫', '福德宫', '父母宫'
        ];
        
        // 地支
        this.diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    }

    // 使用iztro库计算紫薇斗数
    calculate(birthData) {
        const normalized = this.normalizeBirthData(birthData);
        if (!normalized.valid) {
            return this.getUnavailableResult('INVALID_BIRTH_DATA', normalized.error);
        }
        if (!this.iztroAvailable) {
            return this.getUnavailableResult('IZTRO_UNAVAILABLE', '紫微斗数计算库未加载，请刷新页面后重试。');
        }
        return this.calculateWithIztro(normalized.value);
    }

    normalizeBirthData(birthData = {}) {
        const year = Number(birthData.year);
        const month = Number(birthData.month);
        const day = Number(birthData.day);
        const hour = Number(birthData.hour);
        const minute = birthData.minute === undefined || birthData.minute === '' ? 0 : Number(birthData.minute);
        const gender = birthData.gender === 1 || birthData.gender === 'male' ? '男' :
            birthData.gender === 0 || birthData.gender === 'female' ? '女' : birthData.gender;

        if (![year, month, day, hour, minute].every(Number.isInteger)) {
            return { valid: false, error: '出生日期和时间必须是有效整数。' };
        }
        if (year < 1900 || year > 2100 || month < 1 || month > 12 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            return { valid: false, error: '出生日期或时间超出可计算范围。' };
        }
        const date = new Date(Date.UTC(year, month - 1, day));
        if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
            return { valid: false, error: '出生日期不存在，请检查年月日。' };
        }
        if (!['男', '女'].includes(gender)) {
            return { valid: false, error: '性别必须为男或女。' };
        }
        return { valid: true, value: { year, month, day, hour, minute, gender } };
    }

    // 使用iztro库进行专业计算
    calculateWithIztro(birthData) {
        try {
            const { year, month, day, hour, gender } = birthData;
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            // iztro distinguishes early rat hour (00:00) from late rat hour (23:00).
            const timeIndex = hour === 23 ? 12 : Math.floor((hour + 1) / 2);
            const astrolabe = iztro.astro.bySolar(dateStr, timeIndex, gender, true, 'zh-CN');
            if (!astrolabe || !Array.isArray(astrolabe.palaces) || astrolabe.palaces.length !== 12) {
                throw new Error('iztro 返回的命盘结构不完整');
            }
            return this.parseAstrolabe(astrolabe);
        } catch (error) {
            console.error('紫微斗数计算失败:', error);
            return this.getUnavailableResult('IZTRO_CALCULATION_FAILED', `紫微斗数计算失败：${error.message}`);
        }
    }

    // 解析iztro星盘数据
    parseAstrolabe(astrolabe) {
        const palaces = [];
        
        // 遍历十二宫
        astrolabe.palaces.forEach((palace) => {
            const palaceData = {
                name: palace.name,
                earthlyBranch: palace.earthlyBranch,
                heavenlyStem: palace.heavenlyStem,
                majorStars: this.formatStars(palace.majorStars || []),
                minorStars: this.formatStars(palace.minorStars || []),
                adjectiveStars: this.formatStars(palace.adjectiveStars || []),
                majorStarDetails: this.formatStarDetails(palace.majorStars || []),
                minorStarDetails: this.formatStarDetails(palace.minorStars || []),
                adjectiveStarDetails: this.formatStarDetails(palace.adjectiveStars || []),
                changsheng12: palace.changsheng12 || '',
                decadal: palace.decadal || null,
                ages: palace.ages || []
            };
            palaces.push(palaceData);
        });

        return {
            available: true,
            palaces: palaces,
            solarDate: astrolabe.solarDate,
            lunarDate: astrolabe.lunarDate,
            chineseDate: astrolabe.chineseDate,
            time: astrolabe.time,
            timeRange: astrolabe.timeRange,
            sign: astrolabe.sign,
            zodiac: astrolabe.zodiac,
            earthlyBranchOfSoulPalace: astrolabe.earthlyBranchOfSoulPalace,
            earthlyBranchOfBodyPalace: astrolabe.earthlyBranchOfBodyPalace,
            soul: astrolabe.soul,
            body: astrolabe.body,
            fiveElementsClass: astrolabe.fiveElementsClass,
            calculationMethod: 'iztro'
        };
    }

    // 格式化星曜数据
    formatStars(stars) {
        return this.formatStarDetails(stars).map((star) => star.name);
    }

    formatStarDetails(stars) {
        if (!Array.isArray(stars)) return [];
        return stars.map((star) => {
            if (typeof star === 'string') {
                return { name: star, brightness: '', mutagen: '' };
            }
            return {
                name: star?.name || String(star),
                brightness: star?.brightness || '',
                mutagen: star?.mutagen || ''
            };
        });
    }

    getUnavailableResult(errorCode, warning) {
        return {
            available: false,
            errorCode,
            warning,
            palaces: [],
            calculationMethod: 'unavailable'
        };
    }

    // 获取宫位简要信息
    getPalaceSummary(palace) {
        const majorStars = palace.majorStars || [];
        const minorStars = palace.minorStars || [];
        
        return {
            name: palace.name,
            earthlyBranch: palace.earthlyBranch,
            majorStars: majorStars.slice(0, 3), // 只显示前3个主星
            minorStars: minorStars.slice(0, 2), // 只显示前2个辅星
            hasImportantStars: majorStars.length > 0
        };
    }

    // 生成简要分析
    generateSummary(result) {
        if (result?.available === false) {
            return result.warning || '紫微斗数命盘暂时不可用。';
        }
        if (!result || !result.palaces) {
            return '无法生成分析，请检查输入数据';
        }

        let summary = `紫薇斗数命盘分析（${result.calculationMethod === 'iztro' ? '专业版' : '简化版'}）\n\n`;
        
        // 找到命宫
        const soulPalace = result.palaces.find(p => 
            p.earthlyBranch === result.earthlyBranchOfSoulPalace
        );
        
        if (soulPalace) {
            summary += `命宫位于${soulPalace.earthlyBranch}宫\n`;
            if (soulPalace.majorStars.length > 0) {
                summary += `主星：${soulPalace.majorStars.join('、')}\n`;
            }
            if (soulPalace.minorStars.length > 0) {
                summary += `辅星：${soulPalace.minorStars.slice(0, 3).join('、')}\n`;
            }
        }

        // 找到身宫
        const bodyPalace = result.palaces.find(p => 
            p.earthlyBranch === result.earthlyBranchOfBodyPalace
        );
        
        if (bodyPalace && bodyPalace !== soulPalace) {
            summary += `\n身宫位于${bodyPalace.earthlyBranch}宫\n`;
            if (bodyPalace.majorStars.length > 0) {
                summary += `主星：${bodyPalace.majorStars.join('、')}\n`;
            }
        }

        if (result.fiveElementsClass) {
            summary += `\n五行局：${result.fiveElementsClass}\n`;
        }

        if (result.warning) {
            summary += `\n⚠️ ${result.warning}`;
        }

        return summary;
    }
}

// 导出模块
window.ZiweiCalculator = ZiweiCalculator;
