const AcademicYear = require("../../academicStructure/models/academicYear.model");
const Enrollment = require("../../studentManagement/models/enrollments.model");
const Student = require("../../studentManagement/models/students.model");
const Section = require("../../academicStructure/models/section.model");
const User = require("../../user/models/user.model");

const Attendance = require("../../attendanceManagement/models/attendanceEntry.model");

const ExamInstance = require("../../examinationManagement/models/examInstance.model");
const ExamMark = require("../../examinationManagement/models/examMark.model");
const Grade = require("../../academicStructure/models/grade.model");
const GradeSubjectMapping = require("../../academicStructure/models/gradeSubjectMapping.model");
const Subject = require("../../academicStructure/models/subject.model");
const Teacher = require("../../teacherManagement/models/teacher.model");

/*
  ==============================
  Analytics Domain Errors
  ==============================
*/

class AcademicYearNotFoundError extends Error {}
class UnauthorizedYearAccessError extends Error {}
class InvalidDashboardFilterError extends Error {}
class DashboardSectionNotFoundError extends Error {}

/*
  ==============================
  Helper — Safe Percentage
  ==============================
*/

const safePercentage = (num, denom) => {
  if (!denom || denom === 0) return null;
  return Math.round((num / denom) * 100 * 100) / 100;
};

const normalizeDashboardDate = (value) => {
  if (!value) return new Date();

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new InvalidDashboardFilterError("Invalid dashboard date");
  }

  return date;
};

const buildAttendanceDateFilter = (date, attendanceWindow) => {
  const effectiveDate = normalizeDashboardDate(date);

  if (!["MONTHLY", "WEEKLY"].includes(attendanceWindow)) {
    throw new InvalidDashboardFilterError("Invalid attendance window");
  }

  if (attendanceWindow === "WEEKLY") {
    const start = new Date(effectiveDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);

    const end = new Date(effectiveDate);
    end.setHours(23, 59, 59, 999);

    return {
      $gte: start,
      $lte: end,
    };
  }

  const start = new Date(effectiveDate.getFullYear(), effectiveDate.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(effectiveDate);
  end.setHours(23, 59, 59, 999);

  return {
    $gte: start,
    $lte: end,
  };
};

const buildSectionLabel = async (section) => {
  if (!section) return "Unknown";

  const grade = await Grade.findById(section.gradeId);
  const gradeName = grade?.name?.trim();
  const sectionName = section.name?.trim();

  return [gradeName, sectionName].filter(Boolean).join(" ") || "Unknown";
};

const buildAdminSectionLabel = async (section) => {
  if (!section) return "Unknown";

  const grade = await Grade.findById(section.gradeId);
  const gradeName = grade?.name?.trim();
  const sectionName = section.name?.trim()?.toUpperCase();
  const compactName = [gradeName, sectionName].filter(Boolean).join("");

  return compactName ? `Class ${compactName}` : "Unknown";
};

/*
  ==============================
  Helper — Resolve Academic Year
  ==============================
*/

const resolveAcademicYear = async (yearId) => {
  if (yearId) {
    const year = await AcademicYear.findById(yearId);
    if (!year) throw new AcademicYearNotFoundError("Academic year not found");
    return year;
  }

  const activeYear = await AcademicYear.findOne({ status: "ACTIVE" });
  if (!activeYear)
    throw new AcademicYearNotFoundError("Active academic year not found");

  return activeYear;
};

/*
  ==============================
  Helper — Resolve Exam Instance
  ==============================
*/

const resolveExamInstance = async (examInstanceId, academicYearId, examType) => {
  if (examInstanceId) {
    const instance = await ExamInstance.findById(examInstanceId);
    if (!instance) return null;
    if (instance.academicYearId.toString() !== academicYearId.toString())
      return null;
    if (examType && instance.type !== examType) return null;
    return instance;
  }

  if (examType) {
    return await ExamInstance.findOne({
      academicYearId,
      type: examType,
    }).sort({ examDate: -1, createdAt: -1 });
  }

  return await ExamInstance.findOne({
    academicYearId,
  }).sort({ examDate: -1, createdAt: -1 });
};

/*
  ==============================
  SERVICE — ADMIN OVERVIEW
  ==============================
*/

const getAdminOverview = async ({
  yearId,
  date,
  attendanceWindow = "MONTHLY",
  examType,
}) => {
  if (examType && !["HALF_YEARLY", "END_TERM"].includes(examType)) {
    throw new InvalidDashboardFilterError("Invalid exam type");
  }

  /*
    STEP 1 — Resolve Academic Year
  */

  const academicYear = await resolveAcademicYear(yearId);

  /*
    STEP 2 — Active Students Count
  */

  const activeEnrollments = await Enrollment.find({
    academicYearId: academicYear._id,
    enrollmentStatus: "ACTIVE",
  });

  const studentIds = activeEnrollments.map((e) => e.studentId);

  const activeStudents = await Student.find({
    _id: { $in: studentIds },
  }).populate({
    path: "userId",
    match: { status: "ACTIVE" },
  });

  const filteredStudents = activeStudents.filter((s) => s.userId !== null);

  const totalActiveStudents = filteredStudents.length;

  /*
    STEP 3 — Active Teachers Count
  */

  const totalActiveTeachers = await User.countDocuments({
    role: "TEACHER",
    status: "ACTIVE",
  });

  /*
    STEP 4 — Gender Distribution
  */

  const genderDistribution = {
    male: 0,
    female: 0,
    other: 0,
  };

  filteredStudents.forEach((s) => {
    if (s.gender === "MALE") genderDistribution.male++;
    else if (s.gender === "FEMALE") genderDistribution.female++;
    else genderDistribution.other++;
  });

  /*
    STEP 5 — Total Present Students (Date Required)
  */

  let totalPresentStudents = null;

  if (date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      date: {
        $gte: dayStart,
        $lte: dayEnd,
      },
    });

    if (attendance.length === 0) {
      totalPresentStudents = null;
    } else {
      const enrollmentIds = attendance
        .filter((entry) => entry.status === "PRESENT")
        .map((entry) => entry.enrollmentId);

      const enrollments = await Enrollment.find({
        _id: { $in: enrollmentIds },
        academicYearId: academicYear._id,
        enrollmentStatus: "ACTIVE",
      });

      const presentSet = new Set();

      enrollments.forEach((e) => {
        presentSet.add(e.studentId.toString());
      });

      totalPresentStudents = enrollments.length === 0 ? null : presentSet.size;
    }
  }

  /*
    STEP 6 — Section Attendance %
  */

  /*
  STEP 6 — Resolve Sections via Grade → AcademicYear
*/

  const grades = await Grade.find({
    academicYearId: academicYear._id,
    status: "ACTIVE",
  });

  const gradeIds = grades.map((g) => g._id);

  const sections = await Section.find({
    gradeId: { $in: gradeIds },
    status: "ACTIVE",
  });

  const sectionAttendance = [];
  const attendanceDateFilter = buildAttendanceDateFilter(date, attendanceWindow);

  for (const section of sections) {
    const sectionCode = await buildAdminSectionLabel(section);

    const enrollments = await Enrollment.find({
      sectionId: section._id,
      academicYearId: academicYear._id,
      enrollmentStatus: "ACTIVE",
    });

    let percentages = [];

    for (const enrollment of enrollments) {
      const records = await Attendance.find({
        enrollmentId: enrollment._id,
        date: attendanceDateFilter,
      });

      if (records.length === 0) continue;

      const present = records.filter((r) => r.status === "PRESENT").length;

      const percent = safePercentage(present, records.length);

      if (percent !== null) percentages.push(percent);
    }

    const sectionPercent =
      percentages.length === 0
        ? null
        : Math.round(
            (percentages.reduce((a, b) => a + b, 0) / percentages.length) * 100,
          ) / 100;

    sectionAttendance.push({
      sectionId: section._id,
      sectionCode,
      percentage: sectionPercent,
    });
  }

  /*
    STEP 6.5 — Resolve Exam Instance
  */

  const examInstance = await resolveExamInstance(
    null,
    academicYear._id,
    examType,
  );

  /*
    STEP 7 — Section Performance %
  */

  const sectionPerformance = [];

  if (examInstance) {
    for (const section of sections) {
      const sectionCode = await buildAdminSectionLabel(section);

      const enrollments = await Enrollment.find({
        sectionId: section._id,
        academicYearId: academicYear._id,
        enrollmentStatus: "ACTIVE",
      });

      let studentPercentages = [];

      for (const e of enrollments) {
        const marks = await ExamMark.find({
          enrollmentId: e._id,
          examInstanceId: examInstance._id,
        });

        if (marks.length === 0) continue;

        const total = marks.reduce((s, m) => s + m.marks, 0);
        const percent = safePercentage(total, marks.length * 100);

        if (percent !== null) studentPercentages.push(percent);
      }

      const sectionPercent =
        studentPercentages.length === 0
          ? null
          : Math.round(
              (studentPercentages.reduce((a, b) => a + b, 0) /
                studentPercentages.length) *
                100,
            ) / 100;

      sectionPerformance.push({
        sectionId: section._id,
        sectionCode,
        percentage: sectionPercent,
      });
    }
  }

  /*
    STEP 8 — Ranking
  */

  const rank = (list) => {
    const valid = list.filter((i) => i.percentage !== null);

    valid.sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return a.sectionCode.localeCompare(b.sectionCode);
    });

    return {
      top: valid.slice(0, 3),
      bottom: valid.slice(-3),
    };
  };

  const attendanceRank = rank(sectionAttendance);
  const performanceRank = rank(sectionPerformance);

  /*
    FINAL RETURN
  */

  return {
    academicYearId: academicYear._id,
    attendanceWindow,
    examType: examInstance?.type || examType || null,
    totalActiveStudents,
    totalActiveTeachers,
    genderDistribution,
    totalPresentStudents,
    sectionAttendance,
    sectionPerformance,
    attendanceRank,
    performanceRank,
  };
};

/*
  ==============================
  SERVICE — ADMIN SECTION DRILLDOWN
  ==============================
*/

const getAdminSectionDrilldown = async ({
  sectionId,
  yearId,
  examInstanceId,
  examType,
  subjectId,
}) => {
  if (examType && !["HALF_YEARLY", "END_TERM"].includes(examType)) {
    throw new InvalidDashboardFilterError("Invalid exam type");
  }

  /*
    STEP 1 — Resolve Academic Year
  */
  const academicYear = await resolveAcademicYear(yearId);

  /*
    STEP 2 — Validate Section
  */
  const section = await Section.findById(sectionId);

  if (!section) {
    throw new DashboardSectionNotFoundError("Section not found");
  }

  /*
    STEP 3 — Resolve Exam Instance
  */
  const examInstance = await resolveExamInstance(
    examInstanceId,
    academicYear._id,
    examType,
  );

  /*
    STEP 4 — Fetch Active Enrollments
  */
  const enrollmentsRaw = await Enrollment.find({
    sectionId,
    academicYearId: academicYear._id,
    enrollmentStatus: "ACTIVE",
  });

  const studentIds = enrollmentsRaw.map((e) => e.studentId);

  const students = await Student.find({
    _id: { $in: studentIds },
  }).populate({
    path: "userId",
    match: { status: "ACTIVE" },
  });

  const validStudentIds = new Set(
    students.filter((s) => s.userId !== null).map((s) => s._id.toString()),
  );

  const enrollments = enrollmentsRaw.filter((e) =>
    validStudentIds.has(e.studentId.toString()),
  );

  const studentNameByEnrollmentId = new Map();

  enrollments.forEach((enrollment) => {
    const student = students.find(
      (item) => item._id.toString() === enrollment.studentId.toString(),
    );

    studentNameByEnrollmentId.set(
      enrollment._id.toString(),
      student?.fullName || "Unknown",
    );
  });

  /*
    STEP 5 — Student Attendance %
  */
  const studentAttendance = [];

  for (const e of enrollments) {
    const records = await Attendance.find({
      enrollmentId: e._id,
    });

    if (records.length === 0) {
      studentAttendance.push({
        enrollmentId: e._id,
        studentName: studentNameByEnrollmentId.get(e._id.toString()) || "Unknown",
        percentage: null,
      });
      continue;
    }

    const present = records.filter((r) => r.status === "PRESENT").length;

    const percent = safePercentage(present, records.length);

    studentAttendance.push({
      enrollmentId: e._id,
      studentName: studentNameByEnrollmentId.get(e._id.toString()) || "Unknown",
      percentage: percent,
    });
  }

  /*
    STEP 6 — Student Exam %
  */
  const studentPerformance = [];

  if (examInstance) {
    for (const e of enrollments) {
      const markQuery = {
        enrollmentId: e._id,
        examInstanceId: examInstance._id,
      };

      if (subjectId) {
        markQuery.subjectId = subjectId;
      }

      const marks = await ExamMark.find(markQuery);

      if (marks.length === 0) {
        studentPerformance.push({
          enrollmentId: e._id,
          studentName: studentNameByEnrollmentId.get(e._id.toString()) || "Unknown",
          percentage: null,
        });
        continue;
      }

      const total = marks.reduce((s, m) => s + m.marks, 0);

      const percent = safePercentage(total, marks.length * 100);

      studentPerformance.push({
        enrollmentId: e._id,
        studentName: studentNameByEnrollmentId.get(e._id.toString()) || "Unknown",
        percentage: percent,
      });
    }
  }

  /*
    STEP 7 — Subject-wise Section Average
  */
  const subjectAverages = [];

  if (examInstance) {
    const subjectAverageQuery = {
      sectionId,
      examInstanceId: examInstance._id,
    };

    if (subjectId) {
      subjectAverageQuery.subjectId = subjectId;
    }

    const allMarks = await ExamMark.find(subjectAverageQuery);

    const subjectMap = {};

    allMarks.forEach((m) => {
      const key = m.subjectId.toString();

      if (!subjectMap[key]) {
        subjectMap[key] = {
          total: 0,
          count: 0,
        };
      }

      subjectMap[key].total += m.marks;
      subjectMap[key].count += 1;
    });

    for (const subjectId in subjectMap) {
      const { total, count } = subjectMap[subjectId];
      const subject = await Subject.findById(subjectId);

      const percent = safePercentage(total, count * 100);

      subjectAverages.push({
        subjectId,
        subjectName: subject?.name || "Unknown",
        percentage: percent,
      });
    }
  }

  studentAttendance.sort((a, b) =>
    a.studentName.localeCompare(b.studentName),
  );

  studentPerformance.sort((a, b) =>
    a.studentName.localeCompare(b.studentName),
  );

  subjectAverages.sort((a, b) =>
    a.subjectName.localeCompare(b.subjectName),
  );

  /*
    FINAL RETURN
  */
  return {
    sectionId,
    sectionCode: await buildAdminSectionLabel(section),
    academicYearId: academicYear._id,
    examType: examInstance?.type || examType || null,
    studentAttendance,
    studentPerformance,
    subjectAverages,
  };
};

/*
  ==============================
  SERVICE — TEACHER DASHBOARD
  ==============================
*/

const SubjectTeacherAssignment = require("../../teacherAssignmentManagement/models/subjectTeacherAssignment.model");
const ClassTeacherAssignment = require("../../teacherAssignmentManagement/models/classTeacherAssignment.model");

const getTeacherDashboard = async ({ userId, yearId }) => {
  /*
    STEP 1 — Resolve Academic Year
  */
  const academicYear = await resolveAcademicYear(yearId);

  /*
    STEP 2 — Fetch Assignments
  */
  const subjectAssignments = await SubjectTeacherAssignment.find({
    teacherId: userId,
    academicYearId: academicYear._id,
  });

  const classTeacherAssignment = await ClassTeacherAssignment.findOne({
    teacherId: userId,
    academicYearId: academicYear._id,
  });

  if (subjectAssignments.length === 0 && !classTeacherAssignment) {
    return {
      academicYearId: academicYear._id,
      assignmentSummary: {
        classTeacherSection: null,
        subjectClassCount: 0,
        subjectCount: 0,
      },
      sections: [],
    };
  }

  /*
    STEP 3 — Group by Section
  */
  const sectionMap = {};

  subjectAssignments.forEach((a) => {
    const sid = a.sectionId.toString();

    if (!sectionMap[sid]) {
      sectionMap[sid] = {
        sectionId: a.sectionId,
        subjectIds: new Set(),
        assignedSubjectIds: new Set(),
        isClassTeacher: false,
      };
    }

    sectionMap[sid].subjectIds.add(a.subjectId.toString());
    sectionMap[sid].assignedSubjectIds.add(a.subjectId.toString());
  });

  if (classTeacherAssignment) {
    const sid = classTeacherAssignment.sectionId.toString();

    if (!sectionMap[sid]) {
      sectionMap[sid] = {
        sectionId: classTeacherAssignment.sectionId,
        subjectIds: new Set(),
        assignedSubjectIds: new Set(),
        isClassTeacher: true,
      };
    } else {
      sectionMap[sid].isClassTeacher = true;
    }
  }

  const results = [];

  /*
    STEP 4 — Process Each Section
  */
  for (const sid in sectionMap) {
    const { sectionId, subjectIds, assignedSubjectIds, isClassTeacher } =
      sectionMap[sid];

    const section = await Section.findById(sectionId);
    const sectionCode = await buildSectionLabel(section);

    const assignedSubjects = [];

    for (const subjectId of assignedSubjectIds) {
      const subject = await Subject.findById(subjectId);

      assignedSubjects.push({
        subjectId,
        subjectName: subject?.name || "Unknown",
      });
    }

    assignedSubjects.sort((a, b) =>
      a.subjectName.localeCompare(b.subjectName),
    );

    if (isClassTeacher && section?.gradeId) {
      const gradeSubjectMappings = await GradeSubjectMapping.find({
        gradeId: section.gradeId,
        status: "ACTIVE",
      });

      gradeSubjectMappings.forEach((mapping) => {
        subjectIds.add(mapping.subjectId.toString());
      });
    }

    /*
      STEP 4A — Fetch Enrollments
    */
    const enrollmentsRaw = await Enrollment.find({
      sectionId,
      academicYearId: academicYear._id,
      enrollmentStatus: "ACTIVE",
    });

    const studentIds = enrollmentsRaw.map((e) => e.studentId);

    const students = await Student.find({
      _id: { $in: studentIds },
    }).populate({
      path: "userId",
      match: { status: "ACTIVE" },
    });

    const validStudentIds = new Set(
      students.filter((s) => s.userId !== null).map((s) => s._id.toString()),
    );

    const enrollments = enrollmentsRaw.filter((e) =>
      validStudentIds.has(e.studentId.toString()),
    );

    /*
      STEP 4B — Section Attendance %
    */
    let attendancePercentages = [];

    for (const e of enrollments) {
      const records = await Attendance.find({
        enrollmentId: e._id,
      });

      if (records.length === 0) continue;

      const present = records.filter((r) => r.status === "PRESENT").length;

      const percent = safePercentage(present, records.length);

      if (percent !== null) attendancePercentages.push(percent);
    }

    const sectionAttendance =
      attendancePercentages.length === 0
        ? null
        : Math.round(
            (attendancePercentages.reduce((a, b) => a + b, 0) /
              attendancePercentages.length) *
              100,
          ) / 100;

    /*
      STEP 4C — Student Attendance
    */
    const studentAttendance = [];

    for (const e of enrollments) {
      const student = students.find(
        (s) => s._id.toString() === e.studentId.toString(),
      );

      const studentName = student?.fullName || "Unknown";

      const records = await Attendance.find({
        enrollmentId: e._id,
      });

      if (records.length === 0) {
        studentAttendance.push({
          studentName,
          percentage: null,
        });
        continue;
      }

      const present = records.filter((r) => r.status === "PRESENT").length;

      const percent = safePercentage(present, records.length);

      studentAttendance.push({
        studentName,
        percentage: percent,
      });
    }

    /*
      STEP 4D — Resolve Exam Instance
    */
    const examInstance = await resolveExamInstance(null, academicYear._id);

    /*
      STEP 4E — Section Performance %
    */
    let performancePercentages = [];

    if (examInstance) {
      for (const e of enrollments) {
        const marks = await ExamMark.find({
          enrollmentId: e._id,
          examInstanceId: examInstance._id,
        });

        if (marks.length === 0) continue;

        const total = marks.reduce((s, m) => s + m.marks, 0);

        const percent = safePercentage(total, marks.length * 100);

        if (percent !== null) performancePercentages.push(percent);
      }
    }

    const sectionPerformance =
      performancePercentages.length === 0
        ? null
        : Math.round(
            (performancePercentages.reduce((a, b) => a + b, 0) /
              performancePercentages.length) *
              100,
          ) / 100;

    /*
      STEP 4F — Subject Averages
    */
    const subjectAverages = [];
    const assignedSubjectAverages = [];

    if (examInstance) {
      const allMarks = await ExamMark.find({
        sectionId,
        examInstanceId: examInstance._id,
        subjectId: { $in: Array.from(subjectIds) },
      });

      const subjectMap = {};

      allMarks.forEach((m) => {
        const key = m.subjectId.toString();

        if (!subjectMap[key]) {
          subjectMap[key] = { total: 0, count: 0 };
        }

        subjectMap[key].total += m.marks;
        subjectMap[key].count += 1;
      });

      for (const subjectId in subjectMap) {
        const { total, count } = subjectMap[subjectId];

        const subject = await Subject.findById(subjectId);

        const subjectName = subject?.name || "Unknown";

        const percent = safePercentage(total, count * 100);

        const subjectAverage = {
          subjectId,
          subjectName,
          percentage: percent,
        };

        subjectAverages.push(subjectAverage);

        if (assignedSubjectIds.has(subjectId)) {
          assignedSubjectAverages.push(subjectAverage);
        }
      }
    }

    const hasData =
      sectionAttendance !== null ||
      sectionPerformance !== null ||
      studentAttendance.length > 0 ||
      subjectAverages.length > 0 ||
      assignedSubjects.length > 0;

    if (hasData) {
      results.push({
        sectionId,
        sectionCode,
        sectionAttendance,
        sectionPerformance,
        studentAttendance,
        subjectAverages,
        assignedSubjectAverages,
        assignedSubjects,
        isClassTeacher,
      });
    }
  }

  results.sort((a, b) => a.sectionCode.localeCompare(b.sectionCode));

  const classTeacherSection = results.find((section) => section.isClassTeacher);
  const subjectClassIds = new Set(
    subjectAssignments.map((assignment) => assignment.sectionId.toString()),
  );
  const subjectIds = new Set(
    subjectAssignments.map((assignment) => assignment.subjectId.toString()),
  );

  return {
    academicYearId: academicYear._id,
    assignmentSummary: {
      classTeacherSection: classTeacherSection
        ? {
            sectionId: classTeacherSection.sectionId,
            sectionCode: classTeacherSection.sectionCode,
            sectionAttendance: classTeacherSection.sectionAttendance,
            sectionPerformance: classTeacherSection.sectionPerformance,
          }
        : null,
      subjectClassCount: subjectClassIds.size,
      subjectCount: subjectIds.size,
    },
    sections: results,
  };
};

/*
  ==============================
  SERVICE — STUDENT DASHBOARD
  ==============================
*/

const getStudentDashboard = async ({ userId, yearId }) => {
  /*
    STEP 1 — Resolve Academic Year
  */
  const academicYear = await resolveAcademicYear(yearId);

  /*
    STEP 2 — Resolve Student
  */
  const student = await Student.findOne({ userId });

  if (!student) {
    return {
      academicYearId: academicYear._id,
      data: null,
    };
  }

  /*
    STEP 3 — Resolve Enrollment
  */
  const enrollment = await Enrollment.findOne({
    studentId: student._id,
    academicYearId: academicYear._id,
    enrollmentStatus: "ACTIVE",
  });

  if (!enrollment) {
    return {
      academicYearId: academicYear._id,
      data: null,
    };
  }

  const classTeacherAssignment = await ClassTeacherAssignment.findOne({
    sectionId: enrollment.sectionId,
    academicYearId: academicYear._id,
  });

  const classTeacher = classTeacherAssignment
    ? await Teacher.findOne({
        userId: classTeacherAssignment.teacherId,
        status: "ACTIVE",
      })
    : null;

  /*
    STEP 4 — Attendance %
  */
  const attendanceRecords = await Attendance.find({
    enrollmentId: enrollment._id,
  });

  let attendancePercentage = null;

  if (attendanceRecords.length > 0) {
    const present = attendanceRecords.filter(
      (r) => r.status === "PRESENT",
    ).length;

    attendancePercentage = safePercentage(present, attendanceRecords.length);
  }

  /*
    STEP 5 — Fetch Exam Instances (same year)
  */
  const examInstances = await ExamInstance.find({
    academicYearId: academicYear._id,
  }).sort({ type: 1 });
  /*
    STEP 6 — Subject-wise Marks + Totals
  */
  const exams = [];

  for (const exam of examInstances) {
    const marks = await ExamMark.find({
      enrollmentId: enrollment._id,
      examInstanceId: exam._id,
    });

    let total = 0;
    let subjectCount = 0;

    const subjects = [];

    for (const m of marks) {
      total += m.marks;
      subjectCount += 1;

      const subject = await Subject.findById(m.subjectId);

      const subjectName = subject?.name || "Unknown";

      subjects.push({
        subjectName,
        marksObtained: m.marks,
        maxMarks: 100,
      });
    }

    subjects.sort((a, b) => a.subjectName.localeCompare(b.subjectName));

    const percentage =
      subjectCount === 0 ? null : safePercentage(total, subjectCount * 100);

    exams.push({
      examInstanceId: exam._id,
      type: exam.type,
      examDate: exam.examDate,
      subjects,
      totalMarks: subjectCount === 0 ? null : total,
      percentage,
    });
  }

  /*
    STEP 7 — Comparison (Half-Yearly vs End-Term)
  */
  const halfYearly = exams.find((e) => e.type === "HALF_YEARLY");
  const endTerm = exams.find((e) => e.type === "END_TERM");

  let comparison = null;

  if (
    halfYearly &&
    endTerm &&
    halfYearly.percentage !== null &&
    endTerm.percentage !== null
  ) {
    comparison =
      Math.round((endTerm.percentage - halfYearly.percentage) * 100) / 100;
  }

  exams.sort((a, b) => a.type.localeCompare(b.type));
  /*
    FINAL RETURN
  */
  return {
    academicYearId: academicYear._id,
    student: {
      studentId: student._id,
      fullName: student.fullName,
      admissionNumber: student.admissionNumber,
    },
    classTeacher: classTeacher
      ? {
          teacherId: classTeacher.userId,
          fullName: classTeacher.fullName,
          highestQualification: classTeacher.highestQualification,
          qualificationDetail: classTeacher.qualificationDetail,
        }
      : null,
    attendancePercentage,
    exams,
    comparison,
  };
};

module.exports = {
  getAdminOverview,
  getAdminSectionDrilldown,
  getTeacherDashboard,
  getStudentDashboard,
  InvalidDashboardFilterError,
  DashboardSectionNotFoundError,
};
