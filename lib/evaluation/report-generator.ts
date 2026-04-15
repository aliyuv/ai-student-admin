import { getGrade, getGradeInfo, analyzeDimensions } from "./score-calculator"

interface ReportInput {
  name: string
  academic: number
  activity: number
  conduct: number
  attendance: number
  finalScore: number
  studentData?: {
    year?: string
    major?: string
    activities?: Array<{ type: string; title: string; score: number }>
    scores?: Array<{ subject: string; score: number }>
    awards?: Array<{ type: string; level: string }>
  }
}

// 智能评语生成器
class SmartCommentGenerator {
  private templates = {
    excellent: [
      "表现非常出色，各方面能力均达到优秀水平",
      "综合素质优秀，在同年级中表现突出",
      "学习态度端正，实践能力强，是优秀的学生典型"
    ],
    good: [
      "整体表现良好，具备扎实的基础素质",
      "在多个方面表现不错，有继续提升的潜力",
      "学习认真，积极参与各项活动，表现可圈可点"
    ],
    average: [
      "表现中等偏上，各方面发展较为均衡",
      "基本达到要求，在某些方面还有提升空间",
      "学习态度较好，需要在实践方面加强锻炼"
    ],
    below: [
      "基本达到合格标准，但需要在多个方面努力提升",
      "表现一般，建议加强学习和实践的积极性",
      "有一定基础，需要更加努力以达到更好的水平"
    ]
  }

  private dimensionComments = {
    academic: {
      excellent: ["学业成绩优异，专业知识掌握扎实", "各科成绩表现突出，学习能力强"],
      good: ["学业成绩良好，专业基础较为扎实", "课程学习认真，成绩稳定"],
      average: ["学业成绩中等，需要加强专业学习", "课程掌握基本达标，有提升空间"],
      below: ["学业成绩有待提高，需要加强基础学习", "专业课程掌握不够扎实，需要努力"]
    },
    activity: {
      excellent: ["积极参与课外活动，实践能力强", "社团活动表现突出，组织能力好"],
      good: ["能够参与各类活动，实践意识不错", "在课外活动中有一定表现"],
      average: ["课外活动参与度一般，建议增强实践", "实践活动较少，需要提高参与积极性"],
      below: ["很少参与课外活动，缺乏实践锻炼", "实践经验不足，建议积极参与各类活动"]
    },
    conduct: {
      excellent: ["品德优良，多次获得表彰", "道德品质高尚，是同学学习的榜样"],
      good: ["品行表现良好，遵纪守法", "道德素质较好，无违纪行为"],
      average: ["品行表现一般，需要加强自我约束", "道德修养有待提升"],
      below: ["品行表现需要改善，存在违纪现象", "需要加强道德品质修养"]
    },
    attendance: {
      excellent: ["出勤率极高，学习态度端正", "从不缺课，时间观念强"],
      good: ["出勤情况良好，偶有请假", "基本能按时到课，学习态度认真"],
      average: ["出勤情况一般，有迟到现象", "需要改善时间管理，减少缺勤"],
      below: ["出勤率较低，经常缺课迟到", "需要大幅改善出勤情况"]
    }
  }

  private getCommentLevel(score: number): keyof typeof this.templates {
    if (score >= 85) return 'excellent'
    if (score >= 75) return 'good'
    if (score >= 65) return 'average'
    return 'below'
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }

  generateSmartComment(input: ReportInput): string {
    const { name, finalScore, academic, activity, conduct, attendance } = input
    const grade = getGrade(finalScore)
    const level = this.getCommentLevel(finalScore)

    // 分析维度
    const analysis = analyzeDimensions({ academic, activity, conduct, attendance })

    // 基础评语
    let comment = `${name}同学本学期综合评测得分${finalScore}分，评级为"${grade}"。`

    // 整体表现
    comment += this.randomChoice(this.templates[level]) + "。"

    // 维度分析
    if (analysis.balanced) {
      comment += "各维度发展较为均衡。"
    } else {
      const strongestDim = analysis.strongest.name as keyof typeof this.dimensionComments
      const weakestDim = analysis.weakest.name as keyof typeof this.dimensionComments

      comment += this.randomChoice(this.dimensionComments[strongestDim][this.getCommentLevel(analysis.strongest.score)])
      comment += "，但"
      comment += this.randomChoice(this.dimensionComments[weakestDim][this.getCommentLevel(analysis.weakest.score)])
      comment += "。"
    }

    return comment
  }

  generateDetailedAnalysis(input: ReportInput): string[] {
    const analysis: string[] = []
    const { studentData } = input

    // 学业分析
    if (studentData?.scores && studentData.scores.length > 0) {
      const subjects = studentData.scores
      const failedSubjects = subjects.filter(s => s.score < 60)
      const excellentSubjects = subjects.filter(s => s.score >= 90)

      if (excellentSubjects.length > 0) {
        analysis.push(`在${excellentSubjects.map(s => s.subject).join('、')}等科目表现优秀`)
      }
      if (failedSubjects.length > 0) {
        analysis.push(`${failedSubjects.map(s => s.subject).join('、')}等科目需要加强学习`)
      }
    }

    // 活动分析
    if (studentData?.activities && studentData.activities.length > 0) {
      const practiceCount = studentData.activities.filter(a => a.type === 'PRACTICE').length
      const activityCount = studentData.activities.filter(a => a.type === 'ACTIVITY').length

      if (practiceCount > 0 && activityCount > 0) {
        analysis.push(`积极参与了${activityCount}项社团活动和${practiceCount}项实践项目`)
      } else if (practiceCount > 0) {
        analysis.push(`参与了${practiceCount}项实践项目，建议增加社团活动参与`)
      } else if (activityCount > 0) {
        analysis.push(`参与了${activityCount}项社团活动，建议增加实践项目经验`)
      }
    }

    // 品行分析
    if (studentData?.awards && studentData.awards.length > 0) {
      const awards = studentData.awards.filter(a => a.type === 'AWARD')
      const punishments = studentData.awards.filter(a => a.type === 'PUNISHMENT')

      if (awards.length > 0) {
        analysis.push(`获得了${awards.length}项荣誉表彰`)
      }
      if (punishments.length > 0) {
        analysis.push(`有${punishments.length}次违纪记录，需要加强自我约束`)
      }
    }

    return analysis
  }
}

// 建议生成器
class SuggestionGenerator {
  private suggestions = {
    academic: {
      low: [
        "制定详细的学习计划，提高学习效率",
        "寻求任课教师或同学帮助，针对性地补强薄弱科目",
        "增加自主学习时间，培养良好的学习习惯",
        "参加学习小组或辅导班，提升学习效果"
      ],
      medium: [
        "保持现有学习态度，争取更上一层楼",
        "在优势科目基础上，重点攻克薄弱环节",
        "多做课外拓展，提升专业深度和广度"
      ]
    },
    activity: {
      low: [
        "积极报名参与学校和学院组织的各类活动",
        "加入感兴趣的社团，培养兴趣爱好",
        "主动寻找实习和实践机会，提升实践能力",
        "组织或参与志愿服务活动，增强社会责任感"
      ],
      medium: [
        "在现有活动基础上，尝试承担组织和领导角色",
        "拓展活动类型，增加专业相关的实践项目",
        "积极参与竞赛和创新创业项目"
      ]
    },
    conduct: {
      low: [
        "严格遵守校纪校规，加强自我约束",
        "积极参与道德实践活动，提升品德修养",
        "向优秀同学学习，树立正确的价值观",
        "主动承担社会责任，培养奉献精神"
      ],
      medium: [
        "继续保持良好品行，争取获得更多荣誉",
        "发挥模范带头作用，影响和帮助他人",
        "积极参与公益活动，提升社会责任感"
      ]
    },
    attendance: {
      low: [
        "养成良好的作息习惯，保证按时到课",
        "设置提醒，避免忘记上课时间",
        "合理安排时间，减少不必要的缺勤",
        "重视课堂学习，提高时间观念"
      ],
      medium: [
        "继续保持良好的出勤习惯",
        "帮助其他同学树立时间观念",
        "在保证出勤的基础上，提高课堂参与度"
      ]
    }
  }

  generateSuggestions(input: ReportInput): string[] {
    const suggestions: string[] = []
    const { academic, activity, conduct, attendance } = input

    // 根据各维度得分生成建议
    Object.entries({ academic, activity, conduct, attendance }).forEach(([dimension, score]) => {
      if (score < 70) {
        const dimSuggestions = this.suggestions[dimension as keyof typeof this.suggestions]?.low || []
        suggestions.push(this.randomChoice(dimSuggestions))
      } else if (score < 85) {
        const dimSuggestions = this.suggestions[dimension as keyof typeof this.suggestions]?.medium || []
        if (dimSuggestions.length > 0) {
          suggestions.push(this.randomChoice(dimSuggestions))
        }
      }
    })

    // 综合建议
    if (suggestions.length === 0) {
      suggestions.push("继续保持优秀状态，在各个方面都可以作为同学们的榜样")
    }

    return suggestions.slice(0, 3) // 最多返回3条建议
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }
}

// 优势分析器
class StrengthAnalyzer {
  private strengthDescriptions = {
    academic: {
      high: ["学业成绩优异", "专业能力突出", "学习天赋出众"],
      medium: ["学业基础扎实", "学习态度认真", "专业知识掌握良好"]
    },
    activity: {
      high: ["实践能力强", "社会活动积极", "综合素质全面"],
      medium: ["有一定实践经验", "能够参与集体活动", "具备基本的组织能力"]
    },
    conduct: {
      high: ["品德高尚", "道德品质优良", "行为规范典范"],
      medium: ["品行端正", "遵纪守法", "具备基本道德素养"]
    },
    attendance: {
      high: ["时间观念强", "学习态度端正", "自律能力出众"],
      medium: ["基本能按时到课", "具备一定的时间管理能力", "学习态度较好"]
    }
  }

  analyzeStrengths(input: ReportInput): string[] {
    const strengths: string[] = []
    const { academic, activity, conduct, attendance } = input
    const scores = { academic, activity, conduct, attendance }

    // 找出得分较高的维度
    Object.entries(scores).forEach(([dimension, score]) => {
      if (score >= 85) {
        const descriptions = this.strengthDescriptions[dimension as keyof typeof this.strengthDescriptions]?.high || []
        strengths.push(this.randomChoice(descriptions))
      } else if (score >= 75) {
        const descriptions = this.strengthDescriptions[dimension as keyof typeof this.strengthDescriptions]?.medium || []
        if (descriptions.length > 0) {
          strengths.push(this.randomChoice(descriptions))
        }
      }
    })

    return strengths
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
  }
}

// 主要报告生成函数
export function generateReport(input: ReportInput) {
  const commentGenerator = new SmartCommentGenerator()
  const suggestionGenerator = new SuggestionGenerator()
  const strengthAnalyzer = new StrengthAnalyzer()

  const gradeInfo = getGradeInfo(input.finalScore)
  const analysis = analyzeDimensions({
    academic: input.academic,
    activity: input.activity,
    conduct: input.conduct,
    attendance: input.attendance
  })

  return {
    summary: commentGenerator.generateSmartComment(input),
    dimensions: {
      academic: Math.round(input.academic * 10) / 10,
      activity: Math.round(input.activity * 10) / 10,
      conduct: Math.round(input.conduct * 10) / 10,
      attendance: Math.round(input.attendance * 10) / 10,
    },
    strengths: strengthAnalyzer.analyzeStrengths(input),
    suggestions: suggestionGenerator.generateSuggestions(input),
    grade: gradeInfo.label,
    gradeColor: gradeInfo.color,
    gradeDescription: gradeInfo.description,
    comment: commentGenerator.generateSmartComment(input),
    detailedAnalysis: commentGenerator.generateDetailedAnalysis(input),
    dimensionAnalysis: analysis,
    performance: {
      strongest: analysis.strongest,
      weakest: analysis.weakest,
      isBalanced: analysis.balanced,
      average: analysis.average
    }
  }
}

// 批量生成报告
export function generateBatchReports(inputs: ReportInput[]) {
  return inputs.map(input => ({
    studentId: input.name,
    report: generateReport(input)
  }))
}

// 报告对比分析
export function compareReports(current: ReportInput, previous: ReportInput) {
  const currentReport = generateReport(current)
  const previousReport = generateReport(previous)

  const improvements: string[] = []
  const declines: string[] = []

  // 比较各维度变化
  Object.entries(currentReport.dimensions).forEach(([dimension, score]) => {
    const previousScore = previousReport.dimensions[dimension as keyof typeof previousReport.dimensions]
    const change = score - previousScore

    if (change >= 5) {
      improvements.push(`${dimension}提升了${change.toFixed(1)}分`)
    } else if (change <= -5) {
      declines.push(`${dimension}下降了${Math.abs(change).toFixed(1)}分`)
    }
  })

  return {
    improvements,
    declines,
    overallChange: currentReport.dimensions.academic - previousReport.dimensions.academic, // 总分变化
    trendAnalysis: improvements.length > declines.length ? 'improving' :
                  declines.length > improvements.length ? 'declining' : 'stable'
  }
}
