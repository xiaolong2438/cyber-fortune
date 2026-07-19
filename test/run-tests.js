// 起名计算模块自动化测试脚本
// 可以在Node.js环境中运行，也可以在浏览器中运行

// 如果在Node.js环境中运行，需要先加载模块
if (typeof window === 'undefined') {
    // Node.js环境
    const fs = require('fs');
    const path = require('path');

    // 读取并执行数据模块与起名模块
    const kangxiPath = path.join(__dirname, '../js/data/kangxi-strokes.js');
    const catalogPath = path.join(__dirname, '../js/data/name-character-data.js');
    const nameCalculatorPath = path.join(__dirname, '../js/name-calculator.js');
    let nameCalculatorCode = fs.readFileSync(nameCalculatorPath, 'utf8');

    // 创建一个模拟的window对象
    global.window = {};
    eval(fs.readFileSync(kangxiPath, 'utf8'));
    eval(fs.readFileSync(catalogPath, 'utf8'));

    // 执行代码
    try {
        eval(nameCalculatorCode);
    } catch (error) {
        console.error('加载起名计算模块失败:', error.message);
        console.log('尝试直接在浏览器中运行测试...');
        process.exit(1);
    }

    // 获取NameCalculator类
    const NameCalculator = global.window.NameCalculator;

    if (!NameCalculator) {
        console.error('无法加载NameCalculator类');
        process.exit(1);
    }

    console.log('🔮 起名计算模块测试开始...\n');
    runAllTests(NameCalculator);
} else {
    // 浏览器环境
    console.log('请在浏览器中打开 test/name-calculator-test.html 进行测试');
}

function runAllTests(NameCalculator) {
    const nameCalculator = new NameCalculator();
    let passedTests = 0;
    let totalTests = 0;
    
    // 测试用例集合
    const testSuites = [
        {
            name: '笔画数计算测试',
            tests: [
                {
                    name: '常见汉字笔画数',
                    test: () => {
                        const testCases = [
                            ['王', 4],
                            ['李', 7],
                            ['张', 11],
                            ['刘', 15],
                            ['陈', 16],
                            ['一', 1],
                            ['二', 2],
                            ['三', 3]
                        ];
                        
                        for (const [char, expectedStrokes] of testCases) {
                            const actualStrokes = nameCalculator.getCharStrokes(char);
                            if (actualStrokes !== expectedStrokes) {
                                throw new Error(`${char}字笔画数错误：期望${expectedStrokes}，实际${actualStrokes}`);
                            }
                        }
                        return `测试了${testCases.length}个汉字的笔画数`;
                    }
                },
                {
                    name: '生僻字笔画数推算',
                    test: () => {
                        // 测试一些不在字典中的字，应该能返回合理的笔画数
                        const testChars = ['㐀', '㐁', '㐂']; // 一些Unicode扩展区的字
                        let results = [];
                        
                        for (const char of testChars) {
                            const strokes = nameCalculator.getCharStrokes(char);
                            if (strokes < 1 || strokes > 30) {
                                throw new Error(`${char}字笔画数推算不合理：${strokes}`);
                            }
                            results.push(`${char}: ${strokes}画`);
                        }
                        return `推算结果: ${results.join(', ')}`;
                    }
                }
            ]
        },
        {
            name: '五行属性测试',
            tests: [
                {
                    name: '字典中的五行属性',
                    test: () => {
                        const testCases = [
                            ['林', '木'],
                            ['火', '火'],
                            ['土', '土'],
                            ['金', '金'],
                            ['水', '水'],
                            ['森', '木'],
                            ['炎', '火'],
                            ['山', '土'],
                            ['银', '金'],
                            ['江', '水']
                        ];
                        
                        for (const [char, expectedWuXing] of testCases) {
                            const actualWuXing = nameCalculator.getCharWuXing(char);
                            if (actualWuXing !== expectedWuXing) {
                                throw new Error(`${char}字五行属性错误：期望${expectedWuXing}，实际${actualWuXing}`);
                            }
                        }
                        return `测试了${testCases.length}个汉字的五行属性`;
                    }
                },
                {
                    name: '五行属性判断',
                    test: () => {
                        // 测试isCharWuXing方法
                        const testCases = [
                            ['林', '木', true],
                            ['林', '火', false],
                            ['火', '火', true],
                            ['火', '水', false]
                        ];
                        
                        for (const [char, wuXing, expected] of testCases) {
                            const actual = nameCalculator.isCharWuXing(char, wuXing);
                            if (actual !== expected) {
                                throw new Error(`${char}字是否属${wuXing}判断错误：期望${expected}，实际${actual}`);
                            }
                        }
                        return `测试了${testCases.length}个五行判断`;
                    }
                }
            ]
        },
        {
            name: '五格数理测试',
            tests: [
                {
                    name: '单姓双名五格计算',
                    test: () => {
                        const wuge = nameCalculator.calculateWuGe('王', '小明');
                        
                        // 验证五格数值的合理性
                        if (wuge.tianGe <= 0 || wuge.renGe <= 0 || wuge.diGe <= 0 || 
                            wuge.waiGe <= 0 || wuge.zongGe <= 0) {
                            throw new Error('五格数值不能为负数或零');
                        }
                        
                        // 验证总格等于姓名总笔画
                        const totalStrokes = nameCalculator.getCharStrokes('王') + 
                                           nameCalculator.getCharStrokes('小') + 
                                           nameCalculator.getCharStrokes('明');
                        if (wuge.zongGe !== totalStrokes) {
                            throw new Error(`总格计算错误：期望${totalStrokes}，实际${wuge.zongGe}`);
                        }
                        
                        return `王小明五格：天${wuge.tianGe} 人${wuge.renGe} 地${wuge.diGe} 外${wuge.waiGe} 总${wuge.zongGe}`;
                    }
                },
                {
                    name: '单姓单名五格计算',
                    test: () => {
                        const wuge = nameCalculator.calculateWuGe('李', '华');
                        
                        // 单名的地格应该是名字笔画+1
                        const expectedDiGe = nameCalculator.getCharStrokes('华') + 1;
                        if (wuge.diGe !== expectedDiGe) {
                            throw new Error(`单名地格计算错误：期望${expectedDiGe}，实际${wuge.diGe}`);
                        }
                        
                        return `李华五格：天${wuge.tianGe} 人${wuge.renGe} 地${wuge.diGe} 外${wuge.waiGe} 总${wuge.zongGe}`;
                    }
                },
                {
                    name: '复姓双名五格计算',
                    test: () => {
                        const wuge = nameCalculator.calculateWuGe('欧阳', '小明');
                        
                        // 复姓的天格应该是姓氏总笔画
                        const expectedTianGe = nameCalculator.getCharStrokes('欧') + nameCalculator.getCharStrokes('阳');
                        if (wuge.tianGe !== expectedTianGe) {
                            throw new Error(`复姓天格计算错误：期望${expectedTianGe}，实际${wuge.tianGe}`);
                        }
                        
                        return `欧阳小明五格：天${wuge.tianGe} 人${wuge.renGe} 地${wuge.diGe} 外${wuge.waiGe} 总${wuge.zongGe}`;
                    }
                }
            ]
        },
        {
            name: '三才配置测试',
            tests: [
                {
                    name: '三才配置计算',
                    test: () => {
                        const wuge = nameCalculator.calculateWuGe('王', '小明');
                        const sanCai = nameCalculator.calculateSanCai(wuge);
                        
                        // 验证三才五行属性
                        const validWuXing = ['木', '火', '土', '金', '水'];
                        if (!validWuXing.includes(sanCai.tianWuXing) ||
                            !validWuXing.includes(sanCai.renWuXing) ||
                            !validWuXing.includes(sanCai.diWuXing)) {
                            throw new Error('三才五行属性不正确');
                        }
                        
                        // 验证三才代码
                        if (!/^[1-5]{3}$/.test(sanCai.sanCaiCode)) {
                            throw new Error(`三才代码格式错误：${sanCai.sanCaiCode}`);
                        }
                        
                        return `三才配置：${sanCai.tianWuXing}${sanCai.renWuXing}${sanCai.diWuXing} (${sanCai.jiXiong})`;
                    }
                }
            ]
        },
        {
            name: '八字五行分析测试',
            tests: [
                {
                    name: '八字五行需求分析',
                    test: () => {
                        // 模拟八字结果
                        const mockBaziResult = {
                            dayTianGan: '戊',
                            wuxingInfo: {
                                year: { tianGan: '木', diZhi: '水' },
                                month: { tianGan: '火', diZhi: '火' },
                                day: { tianGan: '土', diZhi: '金' },
                                hour: { tianGan: '水', diZhi: '土' }
                            }
                        };
                        
                        const neededWuXing = nameCalculator.analyzeBaziWuXing(mockBaziResult);
                        
                        if (!Array.isArray(neededWuXing) || neededWuXing.length === 0) {
                            throw new Error('八字五行分析结果不正确');
                        }
                        
                        const validWuXing = ['木', '火', '土', '金', '水'];
                        for (const wuXing of neededWuXing) {
                            if (!validWuXing.includes(wuXing)) {
                                throw new Error(`无效的五行属性：${wuXing}`);
                            }
                        }
                        
                        return `需要补充的五行：${neededWuXing.join('、')}`;
                    }
                }
            ]
        },
        {
            name: '起名建议测试',
            tests: [
                {
                    name: '基础起名建议',
                    test: () => {
                        const mockBaziResult = {
                            dayTianGan: '戊',
                            wuxingInfo: {
                                year: { tianGan: '木', diZhi: '水' },
                                month: { tianGan: '火', diZhi: '火' },
                                day: { tianGan: '土', diZhi: '金' },
                                hour: { tianGan: '水', diZhi: '土' }
                            }
                        };
                        
                        const suggestions = nameCalculator.generateNameSuggestions('李', '男', mockBaziResult);
                        
                        if (!Array.isArray(suggestions) || suggestions.length === 0) {
                            throw new Error('起名建议生成失败');
                        }
                        
                        // 验证每个建议的结构
                        for (const suggestion of suggestions) {
                            if (!suggestion.fullName || !suggestion.firstName || 
                                !suggestion.wuGe || !suggestion.sanCai || 
                                typeof suggestion.score !== 'number') {
                                throw new Error('起名建议结构不完整');
                            }
                        }
                        
                        return `生成了${suggestions.length}个起名建议`;
                    }
                },
                {
                    name: '自定义字起名建议',
                    test: () => {
                        const mockBaziResult = {
                            dayTianGan: '戊',
                            wuxingInfo: {
                                year: { tianGan: '木', diZhi: '水' },
                                month: { tianGan: '火', diZhi: '火' },
                                day: { tianGan: '土', diZhi: '金' },
                                hour: { tianGan: '水', diZhi: '土' }
                            }
                        };
                        
                        const customConfig = {
                            firstChar: '志',
                            candidateChars: ['明', '华', '强', '伟']
                        };
                        
                        const suggestions = nameCalculator.generateNameSuggestions('王', '男', mockBaziResult, customConfig);
                        
                        // 验证是否包含指定的第一个字
                        const hasFirstChar = suggestions.some(s => s.firstName.startsWith('志'));
                        if (!hasFirstChar) {
                            throw new Error('未正确使用指定的第一个字');
                        }
                        
                        return `使用自定义字生成了${suggestions.length}个建议`;
                    }
                }
            ]
        },
        {
            name: '姓名分析测试',
            tests: [
                {
                    name: '完整姓名分析',
                    test: () => {
                        const mockBaziResult = {
                            dayTianGan: '戊',
                            wuxingInfo: {
                                year: { tianGan: '木', diZhi: '水' },
                                month: { tianGan: '火', diZhi: '火' },
                                day: { tianGan: '土', diZhi: '金' },
                                hour: { tianGan: '水', diZhi: '土' }
                            }
                        };
                        
                        const analysis = nameCalculator.analyzeName('王小明', mockBaziResult);
                        
                        // 验证分析结果的完整性
                        const requiredFields = ['fullName', 'surname', 'firstName', 'wuGe', 'sanCai', 'score', 'analysis'];
                        for (const field of requiredFields) {
                            if (!(field in analysis)) {
                                throw new Error(`分析结果缺少字段：${field}`);
                            }
                        }
                        
                        if (analysis.score < 0 || analysis.score > 100) {
                            throw new Error(`评分超出范围：${analysis.score}`);
                        }
                        
                        return `${analysis.fullName}分析完成，评分：${analysis.score}分`;
                    }
                }
            ]
        }
    ];
    
    // 运行所有测试
    console.log('开始运行测试...\n');
    
    for (const suite of testSuites) {
        console.log(`📋 ${suite.name}`);
        console.log('─'.repeat(50));
        
        for (const testCase of suite.tests) {
            totalTests++;
            try {
                const result = testCase.test();
                console.log(`✅ ${testCase.name}: ${result}`);
                passedTests++;
            } catch (error) {
                console.log(`❌ ${testCase.name}: ${error.message}`);
            }
        }
        console.log('');
    }
    
    // 输出测试结果统计
    console.log('🎯 测试结果统计');
    console.log('─'.repeat(50));
    console.log(`总测试数：${totalTests}`);
    console.log(`通过测试：${passedTests}`);
    console.log(`失败测试：${totalTests - passedTests}`);
    console.log(`通过率：${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 所有测试通过！起名计算模块工作正常。');
    } else {
        console.log('\n⚠️  部分测试失败，请检查相关功能。');
    }
}

// 如果在浏览器环境中，将函数暴露到全局
if (typeof window !== 'undefined') {
    window.runAllTests = runAllTests;
}
