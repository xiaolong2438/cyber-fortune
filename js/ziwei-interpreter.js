// 紫微斗数白话解释器：只解释本命盘已提供的宫位、主星、亮度与四化。

class ZiweiInterpreter {
    constructor() {
        this.starProfiles = {
            '紫微': {
                overview: '重视格局、秩序与掌控感',
                trait: '先看全局、再组织资源',
                strength: '有统筹意识，遇事愿意担当',
                risk: '标准较高，容易把责任都揽在自己身上',
                advice: '先明确授权边界，不必事事亲自掌控'
            },
            '天机': {
                overview: '思路快，重视变化与方法',
                trait: '边观察边调整，用新方法解决问题',
                strength: '学习快、点子多，善于分析和规划',
                risk: '想法切换太快时，容易犹豫或分散精力',
                advice: '给重要决定设置截止时间，再用小步验证'
            },
            '太阳': {
                overview: '表达直接，愿意照顾团队与大局',
                trait: '主动承担、公开表达并推动事情向前',
                strength: '热心、有行动力，适合站到台前协调',
                risk: '过度付出后容易觉得别人不够回应',
                advice: '在帮助别人之前，先确认自己的时间和承受范围'
            },
            '武曲': {
                overview: '务实果断，重视成果与效率',
                trait: '用目标、数字和执行结果判断事情',
                strength: '执行力强，擅长管理资源和推进难题',
                risk: '太看重效率或得失时，表达可能显得强硬',
                advice: '重要沟通先讲目标，再补充感受与过程'
            },
            '天同': {
                overview: '重视舒适感与关系中的善意',
                trait: '先营造稳定氛围，再逐步推进',
                strength: '亲和、包容，能缓和冲突与压力',
                risk: '不喜欢冲突时，可能拖延必须处理的问题',
                advice: '把难题拆成最小一步，先行动再等待状态变好'
            },
            '廉贞': {
                overview: '界限感强，也在意规则与个人魅力',
                trait: '在原则、关系和现实利益之间寻找平衡',
                strength: '有判断力和策略感，能处理复杂人际',
                risk: '过度在意输赢或评价时，情绪容易绷紧',
                advice: '先区分原则问题和偏好问题，减少无谓消耗'
            },
            '天府': {
                overview: '稳健务实，擅长积累与守成',
                trait: '先建立安全边界，再持续积累资源',
                strength: '可靠、有耐心，适合长期经营和资源配置',
                risk: '过度求稳时，可能错过需要快速试错的机会',
                advice: '保留稳定底盘，同时给新机会设置小额试验空间'
            },
            '太阴': {
                overview: '感受细腻，重视安全感和内在秩序',
                trait: '先观察情绪与细节，再做稳妥判断',
                strength: '细致、有同理心，擅长规划和幕后支持',
                risk: '担心不确定性时，容易反复思量或把话藏起来',
                advice: '把真实需求说具体，减少让别人猜测'
            },
            '贪狼': {
                overview: '好奇心强，善于连接人和新鲜事物',
                trait: '通过体验、社交和多元尝试寻找机会',
                strength: '适应力强，有表现力，也懂得调动气氛',
                risk: '兴趣太多时，容易分散投入或追逐即时反馈',
                advice: '保留探索，但每个阶段只设一个主目标'
            },
            '巨门': {
                overview: '善于质疑、分析和用语言拆解问题',
                trait: '先找逻辑漏洞，再通过讨论形成判断',
                strength: '观察深入，适合研究、表达和谈判',
                risk: '表达太锋利时，容易陷入口舌或反复争论',
                advice: '先确认共同目标，再提出不同意见'
            },
            '天相': {
                overview: '重视公平、分寸与合作秩序',
                trait: '通过协调关系和完善流程推动结果',
                strength: '有服务意识，善于平衡多方立场',
                risk: '过度顾全他人时，自己的需求容易被放到最后',
                advice: '协调之前先写清自己的底线和优先级'
            },
            '天梁': {
                overview: '责任感强，倾向保护、纠偏与解决问题',
                trait: '先判断风险，再为长期稳定补位',
                strength: '有原则、能扛事，适合处理复杂或棘手问题',
                risk: '长期扮演解决者时，容易累积压力或说教感',
                advice: '帮助别人时给出选项，不替对方承担全部后果'
            },
            '七杀': {
                overview: '决断快，适合在变化与压力中开路',
                trait: '遇到挑战时直接行动，以结果校准方向',
                strength: '有魄力、抗压，能处理高难度和不确定任务',
                risk: '节奏过快时，容易忽略协作成本与恢复时间',
                advice: '重大动作前增加一次风险检查，并预留缓冲'
            },
            '破军': {
                overview: '改革意识强，愿意打破旧结构重新开始',
                trait: '发现旧方法失效后，倾向主动重组与突破',
                strength: '敢于创新，适合转型、开荒和处理变化',
                risk: '推翻太快时，可能连可复用的部分也一起舍弃',
                advice: '改变之前先列出必须保留的资产和关系'
            }
        };

        this.domainConfigs = [
            {
                id: 'self',
                title: '性格与做事方式',
                palaceNames: ['命'],
                lead: '你的核心做事方式更偏向',
                emptyAdvice: '结合命宫对宫、三方四正和辅星后再判断，不把“空宫”理解成没有性格。'
            },
            {
                id: 'career',
                title: '事业与工作方式',
                palaceNames: ['官禄'],
                lead: '工作中更容易发挥在',
                emptyAdvice: '先观察真实职业经历与擅长任务，再结合官禄宫对宫判断职业方向。'
            },
            {
                id: 'wealth',
                title: '财务与资源观',
                palaceNames: ['财帛'],
                lead: '处理金钱和资源时更倾向于',
                emptyAdvice: '空宫不代表没有财运，应结合对宫、事业方式和实际现金流习惯一起看。'
            },
            {
                id: 'relationship',
                title: '亲密关系模式',
                palaceNames: ['夫妻'],
                lead: '在亲密关系中更重视',
                emptyAdvice: '关系判断需要双方资料与现实互动，本命盘只用于观察自己的关系需求。'
            },
            {
                id: 'wellbeing',
                title: '内在状态与身心节奏',
                palaceNames: ['福德', '疾厄'],
                lead: '恢复精力和面对压力时更偏向',
                emptyAdvice: '先以睡眠、情绪和体检等真实指标为准，再把命盘当作自我观察提示。',
                disclaimer: '健康内容只用于生活方式提醒，不替代医疗建议、诊断或治疗。'
            },
            {
                id: 'opportunity',
                title: '外部机会与环境适应',
                palaceNames: ['迁移'],
                lead: '进入新环境时更容易通过以下方式打开机会：',
                emptyAdvice: '结合迁移宫对宫和真实迁居、出差、跨界经历，判断外部环境是否适合自己。'
            }
        ];
    }

    interpret(result) {
        if (!result || result.available === false || !Array.isArray(result.palaces)) {
            return {
                available: false,
                message: result?.warning || '命盘数据不完整，暂时无法生成白话解读。',
                sections: []
            };
        }

        const sections = this.domainConfigs.map((config) => this.buildSection(config, result));
        const selfSection = sections.find((section) => section.id === 'self');
        const selfPalace = this.findPalace(result, '命');
        const coreStars = this.getStarDetails(selfPalace);
        const coreProfiles = coreStars
            .map((star) => ({ star, profile: this.starProfiles[star.name] }))
            .filter((item) => item.profile);
        const headline = coreProfiles.length > 1
            ? `${coreProfiles.map(({ star }) => star.name).join('、')}同坐命宫：${coreProfiles.map(({ profile }) => profile.overview).join('；')}`
            : coreProfiles.length === 1
                ? `${coreProfiles[0].star.name}坐命：${coreProfiles[0].profile.overview}`
                : '这张盘需要结合对宫与三方四正继续阅读';
        const tags = [
            ...coreStars.map((star) => star.name),
            result.fiveElementsClass,
            result.soul ? `命主${result.soul}` : '',
            result.body ? `身主${result.body}` : ''
        ].filter(Boolean);

        return {
            available: true,
            overview: {
                headline,
                summary: selfSection?.summary || '先从命宫理解核心倾向，再结合现实经历验证。',
                tags
            },
            sections,
            disclaimer: '以下为本命盘白话解读，属于传统文化参考，不是确定的人生结论；请用真实经历验证，不用于医疗、投资或重大人生决策。'
        };
    }

    buildSection(config, result) {
        const palaces = config.palaceNames
            .map((name) => this.findPalace(result, name))
            .filter(Boolean);
        const stars = palaces.flatMap((palace) => this.getStarDetails(palace));
        const allStars = palaces.flatMap((palace) => this.getAllStarDetails(palace));
        const knownProfiles = stars
            .map((star) => ({ star, profile: this.starProfiles[star.name] }))
            .filter((item) => item.profile);
        const unknownMajorStars = stars.filter((star) => !this.starProfiles[star.name]);
        const transformationNotes = this.unique(
            allStars.map((star) => this.getTransformationNote(star)).filter(Boolean)
        );
        const evidence = palaces.length
            ? palaces.map((palace) => this.formatPalaceEvidence(palace)).join('；')
            : `${config.title}对应宫位数据缺失`;

        if (knownProfiles.length === 0) {
            const hasStars = stars.length > 0;
            return {
                id: config.id,
                title: config.title,
                summary: hasStars
                    ? '本页词典尚未覆盖本宫主星，暂不单独下结论。'
                    : '本宫暂无十四主星，不适合单独下结论。',
                strengths: '先记录真实经历中的稳定模式，比套用单一星曜标签更可靠。',
                watchFor: this.unique([
                    hasStars
                        ? '本宫有主星，但当前词典尚未覆盖；不将其当作空宫，也不据此判断吉凶。'
                        : '空宫不等于没有该领域，也不直接代表吉或凶。',
                    ...transformationNotes
                ]).join('；'),
                advice: config.emptyAdvice,
                evidence,
                disclaimer: config.disclaimer || ''
            };
        }

        const profiles = knownProfiles.map((item) => item.profile);
        const traits = this.unique(profiles.map((profile) => profile.trait)).slice(0, 2);
        const brightnessNotes = knownProfiles
            .map(({ star }) => this.getBrightnessNote(star))
            .filter(Boolean);
        const strengths = this.unique([
            ...profiles.map((profile) => profile.strength),
            ...brightnessNotes.filter((note) => note.type === 'strength').map((note) => note.text)
        ]).slice(0, 3);
        const risks = this.unique([
            ...profiles.map((profile) => profile.risk),
            ...brightnessNotes.filter((note) => note.type === 'watch').map((note) => note.text)
        ]).slice(0, 3);
        const partialCoverageNote = unknownMajorStars.length
            ? `本页仅解释已覆盖星曜；${unknownMajorStars.map((star) => star.name).join('、')}尚未纳入判断`
            : '';
        const advice = this.unique(profiles.map((profile) => profile.advice)).slice(0, 2);

        return {
            id: config.id,
            title: config.title,
            summary: `${config.lead}${traits.join('，同时也会')}。`,
            strengths: strengths.join('；'),
            watchFor: [...risks, ...transformationNotes, partialCoverageNote].filter(Boolean).join('；'),
            advice: advice.join('；'),
            evidence,
            disclaimer: config.disclaimer || ''
        };
    }

    normalizePalaceName(name) {
        return String(name || '')
            .replace(/宫$/u, '')
            .replace(/^奴仆$/u, '仆役');
    }

    findPalace(result, name) {
        const normalized = this.normalizePalaceName(name);
        return result.palaces.find((palace) => this.normalizePalaceName(palace.name) === normalized) || null;
    }

    getStarDetails(palace) {
        if (!palace) return [];
        if (Array.isArray(palace.majorStarDetails)) {
            return palace.majorStarDetails.map((star) => ({
                name: star?.name || '',
                brightness: star?.brightness || '',
                mutagen: star?.mutagen || ''
            })).filter((star) => star.name);
        }
        return (palace.majorStars || []).map((name) => ({ name, brightness: '', mutagen: '' }));
    }

    getAllStarDetails(palace) {
        if (!palace) return [];
        const groups = [
            { details: 'majorStarDetails', names: 'majorStars', category: '主星' },
            { details: 'minorStarDetails', names: 'minorStars', category: '辅星' },
            { details: 'adjectiveStarDetails', names: 'adjectiveStars', category: '杂曜' }
        ];
        return groups.flatMap(({ details, names, category }) => {
            if (Array.isArray(palace[details])) {
                return palace[details].map((star) => ({
                    name: star?.name || '',
                    brightness: star?.brightness || '',
                    mutagen: star?.mutagen || '',
                    category
                })).filter((star) => star.name);
            }
            return (palace[names] || []).map((name) => ({
                name,
                brightness: '',
                mutagen: '',
                category
            }));
        });
    }

    formatPalaceEvidence(palace) {
        const palaceName = `${this.normalizePalaceName(palace.name)}宫`;
        const branch = palace.earthlyBranch ? `（${palace.earthlyBranch}）` : '';
        const stars = this.getAllStarDetails(palace);
        const majorStars = stars.filter((star) => star.category === '主星');
        const supportingStars = stars.filter((star) => star.category !== '主星');
        if (stars.length === 0) return `${palaceName}${branch}为空宫，暂无十四主星`;
        const parts = [];
        parts.push(majorStars.length
            ? majorStars.map((star) => this.formatStar(star)).join('、')
            : '暂无十四主星');
        if (supportingStars.length) {
            const transformedSupportingStars = supportingStars.filter((star) => star.mutagen);
            const untransformedCounts = supportingStars
                .filter((star) => !star.mutagen)
                .reduce((counts, star) => {
                    counts[star.category] = (counts[star.category] || 0) + 1;
                    return counts;
                }, {});
            if (transformedSupportingStars.length) {
                parts.push(transformedSupportingStars.map((star) => `${star.category}${this.formatStar(star)}`).join('、'));
            }
            const countSummary = ['辅星', '杂曜']
                .filter((category) => untransformedCounts[category])
                .map((category) => `${category}${untransformedCounts[category]}颗`)
                .join('、');
            if (countSummary) parts.push(`另有${countSummary}`);
        }
        return `${palaceName}${branch}：${parts.join('；')}`;
    }

    formatStar(star) {
        const brightness = star.brightness ? `（${star.brightness}）` : '';
        const mutagen = star.mutagen ? `化${star.mutagen}` : '';
        return `${star.name}${brightness}${mutagen}`;
    }

    getTransformationNote(star) {
        const notes = {
            '禄': `${star.name}化禄会放大资源、人缘或机会感，也要留意过度依赖顺势`,
            '权': `${star.name}化权会增强主动性、掌控感与责任压力`,
            '科': `${star.name}化科会突出表达、口碑和被认可的需求`,
            '忌': `${star.name}化忌提示这个主题更容易反复、在意得失或感到压力`
        };
        return notes[star.mutagen] || '';
    }

    getBrightnessNote(star) {
        if (['庙', '旺'].includes(star.brightness)) {
            return {
                type: 'strength',
                text: `${star.name}为${star.brightness}，相关倾向在传统解释中更容易显现，但仍需结合实际经历验证`
            };
        }
        if (['陷', '不'].includes(star.brightness)) {
            return {
                type: 'watch',
                text: `${star.name}为${star.brightness}，相关倾向更受情境和经验影响，建议保留验证余地`
            };
        }
        return null;
    }

    unique(values) {
        return [...new Set(values.filter(Boolean))];
    }
}

window.ZiweiInterpreter = ZiweiInterpreter;
