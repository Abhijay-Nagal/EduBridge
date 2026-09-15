// Demo dataset for EduBridge. Dates are generated relative to "today" so the
// app always looks current no matter when it is opened.

const DAY = 86400000

const iso = (offsetDays = 0) => {
  const d = new Date(Date.now() + offsetDays * DAY)
  return d.toISOString().slice(0, 10)
}
const stamp = (offsetDays = 0, hour = 10) => {
  const d = new Date(Date.now() + offsetDays * DAY)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const DEMO_ACCOUNTS = [
  { role: 'admin', loginId: '9000000001', password: 'admin123', label: 'Administration' },
  { role: 'student', loginId: '9000000010', password: 'student123', label: 'Student' },
  { role: 'parent', loginId: '9000000020', password: 'parent123', label: 'Parent' },
]

export function buildSeed() {
  const institute = {
    id: 'inst-1',
    name: 'Sharma Classes',
    tagline: 'Science & Mathematics Coaching',
  }

  const batches = [
    { id: 'b1', name: 'Class 10 — Batch A', subject: 'Science & Maths', timing: 'Mon–Sat, 5:00 PM' },
    { id: 'b2', name: 'Class 10 — Batch B', subject: 'Science & Maths', timing: 'Mon–Sat, 7:00 PM' },
    { id: 'b3', name: 'Class 12 — Physics', subject: 'Physics', timing: 'Tue/Thu/Sat, 6:30 PM' },
  ]

  const users = [
    { id: 'u-admin', name: 'Rajesh Sharma', loginId: '9000000001', password: 'admin123', role: 'admin' },

    { id: 'u-s1', name: 'Aarav Gupta', loginId: '9000000010', password: 'student123', role: 'student' },
    { id: 'u-s2', name: 'Diya Verma', loginId: '9000000011', password: 'student123', role: 'student' },
    { id: 'u-s3', name: 'Kabir Singh', loginId: '9000000012', password: 'student123', role: 'student' },
    { id: 'u-s4', name: 'Ishita Rao', loginId: '9000000013', password: 'student123', role: 'student' },
    { id: 'u-s5', name: 'Rohan Mehta', loginId: '9000000014', password: 'student123', role: 'student' },
    { id: 'u-s6', name: 'Ananya Nair', loginId: '9000000015', password: 'student123', role: 'student' },

    { id: 'u-p1', name: 'Sunita Gupta', loginId: '9000000020', password: 'parent123', role: 'parent' },
    { id: 'u-p2', name: 'Manoj Verma', loginId: '9000000021', password: 'parent123', role: 'parent' },
    { id: 'u-p3', name: 'Preeti Singh', loginId: '9000000022', password: 'parent123', role: 'parent' },
  ]

  const students = [
    { id: 'st1', userId: 'u-s1', batchId: 'b1', rollNo: '10A-01' },
    { id: 'st2', userId: 'u-s2', batchId: 'b1', rollNo: '10A-02' },
    { id: 'st3', userId: 'u-s3', batchId: 'b1', rollNo: '10A-03' },
    { id: 'st4', userId: 'u-s4', batchId: 'b2', rollNo: '10B-01' },
    { id: 'st5', userId: 'u-s5', batchId: 'b2', rollNo: '10B-02' },
    { id: 'st6', userId: 'u-s6', batchId: 'b3', rollNo: '12P-01' },
  ]

  const parents = [
    { id: 'pa1', userId: 'u-p1' },
    { id: 'pa2', userId: 'u-p2' },
    { id: 'pa3', userId: 'u-p3' },
  ]

  // Sunita has two children enrolled — exercises the multi-child flow.
  const parentLinks = [
    { parentId: 'pa1', studentId: 'st1' },
    { parentId: 'pa1', studentId: 'st4' },
    { parentId: 'pa2', studentId: 'st2' },
    { parentId: 'pa3', studentId: 'st3' },
  ]

  const materials = [
    { id: 'm1', batchId: 'b1', subject: 'Physics', topic: 'Light — Reflection', title: 'Ray Diagrams — Class Notes', kind: 'note', body: 'Covers laws of reflection, spherical mirrors, mirror formula and sign convention. Solve Q1–Q14 from the exercise sheet before the next class.', uploadedBy: 'u-admin', uploadedAt: stamp(-2) },
    { id: 'm2', batchId: 'b1', subject: 'Maths', topic: 'Quadratic Equations', title: 'Practice Sheet — 30 Problems', kind: 'note', body: 'Mixed difficulty. Attempt the starred questions only after finishing the first 20.', uploadedBy: 'u-admin', uploadedAt: stamp(-5) },
    { id: 'm3', batchId: 'b1', subject: 'Chemistry', topic: 'Acids, Bases and Salts', title: 'Reference Video — pH Scale', kind: 'link', url: 'https://www.khanacademy.org/science/chemistry', uploadedBy: 'u-admin', uploadedAt: stamp(-8) },
    { id: 'm4', batchId: 'b2', subject: 'Maths', topic: 'Trigonometry', title: 'Formula Sheet', kind: 'note', body: 'All identities required for the board exam, grouped by chapter.', uploadedBy: 'u-admin', uploadedAt: stamp(-3) },
    { id: 'm5', batchId: 'b3', subject: 'Physics', topic: 'Electrostatics', title: "Gauss's Law — Worked Examples", kind: 'note', body: 'Six solved problems on flux through closed surfaces, plus derivations.', uploadedBy: 'u-admin', uploadedAt: stamp(-1) },
  ]

  const quizzes = [
    {
      id: 'q1',
      batchId: 'b1',
      subject: 'Physics',
      title: 'Light — Reflection (Quick Test)',
      publishedAt: stamp(-2),
      dueAt: stamp(3, 21),
      questions: [
        { id: 'q1a', text: 'The image formed by a plane mirror is always:', options: ['Real and inverted', 'Virtual and erect', 'Real and erect', 'Virtual and inverted'], correctIndex: 1, marks: 1 },
        { id: 'q1b', text: 'The focal length of a spherical mirror of radius R is:', options: ['R', 'R/2', '2R', 'R/4'], correctIndex: 1, marks: 1 },
        { id: 'q1c', text: 'A concave mirror produces a magnification of -1. The object is at:', options: ['Focus', 'Centre of curvature', 'Infinity', 'Between pole and focus'], correctIndex: 1, marks: 1 },
        { id: 'q1d', text: 'Which mirror is used as a rear-view mirror in vehicles?', options: ['Concave', 'Plane', 'Convex', 'Cylindrical'], correctIndex: 2, marks: 1 },
      ],
    },
    {
      id: 'q2',
      batchId: 'b1',
      subject: 'Maths',
      title: 'Quadratic Equations — Surprise Test',
      publishedAt: stamp(-6),
      dueAt: stamp(-1, 21),
      questions: [
        { id: 'q2a', text: 'The discriminant of 2x² − 4x + 2 = 0 is:', options: ['0', '4', '8', '−4'], correctIndex: 0, marks: 1 },
        { id: 'q2b', text: 'If the roots are equal, the discriminant must be:', options: ['Greater than 0', 'Less than 0', 'Equal to 0', 'Undefined'], correctIndex: 2, marks: 1 },
        { id: 'q2c', text: 'The sum of roots of ax² + bx + c = 0 is:', options: ['−b/a', 'b/a', 'c/a', '−c/a'], correctIndex: 0, marks: 1 },
      ],
    },
    {
      id: 'q3',
      batchId: 'b3',
      subject: 'Physics',
      title: 'Electrostatics — Concept Check',
      publishedAt: stamp(-1),
      dueAt: stamp(4, 21),
      questions: [
        { id: 'q3a', text: 'The SI unit of electric flux is:', options: ['N·m²/C', 'N/C', 'C/m²', 'V/m'], correctIndex: 0, marks: 1 },
        { id: 'q3b', text: 'Electric field inside a charged hollow conductor is:', options: ['Maximum', 'Zero', 'Uniform and non-zero', 'Depends on shape'], correctIndex: 1, marks: 1 },
      ],
    },
  ]

  const attempts = [
    { id: 'at1', quizId: 'q2', studentId: 'st1', answers: { q2a: 0, q2b: 2, q2c: 1 }, score: 2, maxScore: 3, attemptedAt: stamp(-5, 19) },
    { id: 'at2', quizId: 'q2', studentId: 'st2', answers: { q2a: 0, q2b: 2, q2c: 0 }, score: 3, maxScore: 3, attemptedAt: stamp(-5, 18) },
    { id: 'at3', quizId: 'q2', studentId: 'st3', answers: { q2a: 1, q2b: 2, q2c: 0 }, score: 2, maxScore: 3, attemptedAt: stamp(-4, 20) },
  ]

  // 21 working days of attendance (Sundays skipped) for every student.
  const attendance = []
  let seq = 0
  for (let d = 30; d >= 1; d--) {
    const date = new Date(Date.now() - d * DAY)
    if (date.getDay() === 0) continue
    const dateStr = date.toISOString().slice(0, 10)
    for (const st of students) {
      // Deterministic pseudo-random so the demo data is stable across reloads.
      const h = (st.id.charCodeAt(2) * 31 + d * 17) % 100
      const status = h < 8 ? 'absent' : h < 14 ? 'late' : 'present'
      attendance.push({
        id: `att${seq++}`,
        studentId: st.id,
        batchId: st.batchId,
        date: dateStr,
        status,
        markedBy: 'u-admin',
      })
    }
  }

  const marks = [
    { id: 'mk1', studentId: 'st1', term: 'Unit Test 1', subject: 'Physics', marks: 34, maxMarks: 40, remark: 'Strong on numericals. Revise ray diagrams.', enteredBy: 'u-admin', enteredAt: stamp(-20) },
    { id: 'mk2', studentId: 'st1', term: 'Unit Test 1', subject: 'Maths', marks: 28, maxMarks: 40, remark: 'Careless mistakes in algebra. Practice more.', enteredBy: 'u-admin', enteredAt: stamp(-20) },
    { id: 'mk3', studentId: 'st1', term: 'Unit Test 1', subject: 'Chemistry', marks: 31, maxMarks: 40, remark: 'Good conceptual clarity.', enteredBy: 'u-admin', enteredAt: stamp(-20) },
    { id: 'mk4', studentId: 'st1', term: 'Unit Test 2', subject: 'Physics', marks: 37, maxMarks: 40, remark: 'Excellent improvement.', enteredBy: 'u-admin', enteredAt: stamp(-6) },
    { id: 'mk5', studentId: 'st1', term: 'Unit Test 2', subject: 'Maths', marks: 33, maxMarks: 40, remark: 'Much better. Keep it up.', enteredBy: 'u-admin', enteredAt: stamp(-6) },
    { id: 'mk6', studentId: 'st1', term: 'Unit Test 2', subject: 'Chemistry', marks: 30, maxMarks: 40, remark: 'Revise organic reactions.', enteredBy: 'u-admin', enteredAt: stamp(-6) },

    { id: 'mk7', studentId: 'st2', term: 'Unit Test 1', subject: 'Physics', marks: 38, maxMarks: 40, remark: 'Top of the batch.', enteredBy: 'u-admin', enteredAt: stamp(-20) },
    { id: 'mk8', studentId: 'st2', term: 'Unit Test 1', subject: 'Maths', marks: 36, maxMarks: 40, remark: 'Very consistent.', enteredBy: 'u-admin', enteredAt: stamp(-20) },
    { id: 'mk9', studentId: 'st2', term: 'Unit Test 2', subject: 'Physics', marks: 39, maxMarks: 40, remark: 'Outstanding.', enteredBy: 'u-admin', enteredAt: stamp(-6) },
    { id: 'mk10', studentId: 'st2', term: 'Unit Test 2', subject: 'Maths', marks: 35, maxMarks: 40, remark: 'Well done.', enteredBy: 'u-admin', enteredAt: stamp(-6) },

    { id: 'mk11', studentId: 'st4', term: 'Unit Test 1', subject: 'Maths', marks: 22, maxMarks: 40, remark: 'Needs regular practice at home.', enteredBy: 'u-admin', enteredAt: stamp(-20) },
    { id: 'mk12', studentId: 'st4', term: 'Unit Test 2', subject: 'Maths', marks: 27, maxMarks: 40, remark: 'Improving steadily.', enteredBy: 'u-admin', enteredAt: stamp(-6) },
  ]

  const fees = [
    { id: 'f1', studentId: 'st1', amount: 2500, dueDate: iso(4), cycle: 'Monthly — September', status: 'due' },
    { id: 'f2', studentId: 'st1', amount: 2500, dueDate: iso(-26), cycle: 'Monthly — August', status: 'paid' },
    { id: 'f3', studentId: 'st2', amount: 2500, dueDate: iso(-3), cycle: 'Monthly — September', status: 'overdue' },
    { id: 'f4', studentId: 'st3', amount: 2500, dueDate: iso(4), cycle: 'Monthly — September', status: 'due' },
    { id: 'f5', studentId: 'st4', amount: 2500, dueDate: iso(-2), cycle: 'Monthly — September', status: 'overdue' },
    { id: 'f6', studentId: 'st5', amount: 2500, dueDate: iso(6), cycle: 'Monthly — September', status: 'due' },
    { id: 'f7', studentId: 'st6', amount: 3200, dueDate: iso(-26), cycle: 'Monthly — August', status: 'paid' },
    { id: 'f8', studentId: 'st6', amount: 3200, dueDate: iso(5), cycle: 'Monthly — September', status: 'due' },
  ]

  const payments = [
    { id: 'pay1', feeId: 'f2', studentId: 'st1', amount: 2500, paidOn: iso(-27), mode: 'UPI' },
    { id: 'pay2', feeId: 'f7', studentId: 'st6', amount: 3200, paidOn: iso(-28), mode: 'Cash' },
  ]

  const notifications = [
    { id: 'n1', title: 'No class tomorrow', body: 'I am unwell and will not be able to take tomorrow’s class. We will cover the missed topic on Saturday at the usual time.', type: 'alert', audience: 'all', batchId: null, createdBy: 'u-admin', createdAt: stamp(-1, 17) },
    { id: 'n2', title: 'Unit Test 3 — schedule', body: 'Unit Test 3 will be held next Monday. Syllabus: Light (full chapter) and Quadratic Equations.', type: 'exam', audience: 'all', batchId: 'b1', createdBy: 'u-admin', createdAt: stamp(-3, 16) },
    { id: 'n3', title: 'September fee reminder', body: 'The September fee of ₹2,500 is due on the 20th. Kindly pay via UPI or at the front desk.', type: 'fee', audience: 'parents', batchId: null, createdBy: 'u-admin', createdAt: stamp(-2, 11) },
    { id: 'n4', title: 'New study material uploaded', body: 'Ray Diagrams class notes are now available under Study Material.', type: 'info', audience: 'students', batchId: 'b1', createdBy: 'u-admin', createdAt: stamp(-2, 12) },
    { id: 'n5', title: 'Parent–teacher meeting', body: 'A short PTM is scheduled for this Sunday, 11 AM to 1 PM. Please try to attend.', type: 'info', audience: 'parents', batchId: null, createdBy: 'u-admin', createdAt: stamp(-6, 10) },
  ]

  return {
    version: 1,
    institute,
    batches,
    users,
    students,
    parents,
    parentLinks,
    materials,
    quizzes,
    attempts,
    attendance,
    marks,
    fees,
    payments,
    notifications,
    reads: [],
  }
}
