const mongoose = require('mongoose');

const technicalQuestionSchema = new mongoose.Schema({
    question:  { type: String, required: true },
    intention: { type: String, required: true },
    answer:    { type: String, required: true }
}, { _id: false })

const behavioralQuestionSchema = new mongoose.Schema({
    question:  { type: String, required: true },
    intention: { type: String, required: true },
    answer:    { type: String, required: true }
}, { _id: false })

const skillGapSchema = new mongoose.Schema({
    skill:    { type: String, required: true },
    severity: { type: String, enum: ["low", "medium", "high"], required: true }
}, { _id: false })

const preparationPlanSchema = new mongoose.Schema({
    day:   { type: Number, required: true },
    focus: { type: String, required: true },
    tasks: [{ type: String, required: true }]
})

// Expanded to support both legacy and new LeetCode-style challenges
const codingChallengeSchema = new mongoose.Schema({
    title:          { type: String, required: true },
    difficulty:     { type: String },
    category:       { type: String },
    topics:         [{ type: String }],
    // Legacy field
    description:    { type: String },
    // New structured fields
    problemStatement: { type: String },
    examples: [{
        input:       { type: String },
        output:      { type: String },
        explanation: { type: String }
    }],
    constraints:    [{ type: String }],
    hint:           { type: String },
    starterCode:    { type: String },
    solution:       { type: String },
    timeComplexity: { type: String },
    spaceComplexity:{ type: String }
}, { _id: false })

const interviewReportSchema = new mongoose.Schema({
    jobDescription:    { type: String, required: true },
    resume:            { type: String },
    selfDescription:   { type: String },
    companyPreset:     { type: String, default: "default" },
    matchScore:        { type: Number, min: 0, max: 100 },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions:[behavioralQuestionSchema],
    skillGaps:          [skillGapSchema],
    preparationPlan:    [preparationPlanSchema],
    codingChallenges:   [codingChallengeSchema],
    user:               { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    title:              { type: String, required: true },
    shareToken:         { type: String, unique: true, sparse: true },
    // New Tier 2 fields
    notes:              { type: String, default: '' },
    roadmapProgress:    { type: Map, of: [Number], default: {} }
}, { timestamps: true })

const interviewReportModel = mongoose.model("InterviewReport", interviewReportSchema);
module.exports = interviewReportModel;