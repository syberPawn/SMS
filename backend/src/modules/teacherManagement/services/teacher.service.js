const Teacher = require("../models/teacher.model");
const User = require("../../user/models/user.model");
const { createUser } = require("../../user/services/user.service");
const ClassTeacherAssignment = require("../../teacherAssignmentManagement/models/classTeacherAssignment.model");
const SubjectTeacherAssignment = require("../../teacherAssignmentManagement/models/subjectTeacherAssignment.model");
const {
  DuplicateUserError,
  ValidationError,
} = require("../../user/services/user.service");

class TeacherValidationError extends Error {}
class TeacherUsernameGenerationError extends Error {}

const qualificationNeedsDetail = new Set([
  "Bachelor Degree",
  "Master's Degree",
  "Phd",
  "Other",
]);

const normalizeTeacherUsername = (fullName) =>
  fullName.toLowerCase().replace(/[^a-z0-9]/g, "");

const buildUniqueTeacherUsername = async (fullName) => {
  const base = normalizeTeacherUsername(fullName);

  if (!base) {
    throw new TeacherUsernameGenerationError("Unable to generate username");
  }

  let candidate = base;
  let suffix = 2;

  while (await User.findOne({ username: candidate })) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const validateTeacherPayload = ({
  fullName,
  highestQualification,
  qualificationDetail,
}) => {
  const trimmedName = fullName?.trim();
  const trimmedDetail = qualificationDetail?.trim();

  if (!trimmedName) {
    throw new TeacherValidationError("Teacher full name is required");
  }

  if (
    ![
      "10+2",
      "Bachelor Degree",
      "Master's Degree",
      "Phd",
      "Other",
    ].includes(highestQualification)
  ) {
    throw new TeacherValidationError("Invalid highest qualification");
  }

  if (qualificationNeedsDetail.has(highestQualification) && !trimmedDetail) {
    throw new TeacherValidationError(
      highestQualification === "Other"
        ? "Qualification detail is required"
        : "Specialization is required",
    );
  }

  if (!qualificationNeedsDetail.has(highestQualification) && trimmedDetail) {
    return {
      fullName: trimmedName,
      highestQualification,
      qualificationDetail: null,
    };
  }

  return {
    fullName: trimmedName,
    highestQualification,
    qualificationDetail: trimmedDetail || null,
  };
};

const createTeacher = async (data, adminContext) => {
  const validated = validateTeacherPayload(data);
  const username = await buildUniqueTeacherUsername(validated.fullName);
  const password = "Teacher123";

  let user = null;

  try {
    user = await createUser(adminContext, {
      username,
      password,
      role: "TEACHER",
    });

    const teacher = await Teacher.create({
      userId: user.userId,
      fullName: validated.fullName,
      highestQualification: validated.highestQualification,
      qualificationDetail: validated.qualificationDetail,
      status: "ACTIVE",
    });

    return {
      teacher,
      credentials: {
        username,
        password,
      },
    };
  } catch (error) {
    if (user?.userId) {
      await Teacher.deleteMany({ userId: user.userId });
      await User.deleteOne({ _id: user.userId });
    }

    if (
      error instanceof TeacherValidationError ||
      error instanceof TeacherUsernameGenerationError ||
      error instanceof DuplicateUserError ||
      error instanceof ValidationError
    ) {
      throw error;
    }

    throw error;
  }
};

const buildTeacherAssignmentMaps = async (academicYearId) => {
  if (!academicYearId) {
    return {
      classAssignmentsByTeacherId: new Map(),
      subjectAssignmentsByTeacherId: new Map(),
    };
  }

  const [classAssignments, subjectAssignments] = await Promise.all([
    ClassTeacherAssignment.find({ academicYearId }).populate({
      path: "sectionId",
      select: "name gradeId",
      populate: {
        path: "gradeId",
        select: "name",
      },
    }),
    SubjectTeacherAssignment.find({ academicYearId })
      .populate("subjectId", "name")
      .populate({
        path: "sectionId",
        select: "name gradeId",
        populate: {
          path: "gradeId",
          select: "name",
        },
      }),
  ]);

  const classAssignmentsByTeacherId = new Map();
  const subjectAssignmentsByTeacherId = new Map();

  classAssignments.forEach((assignment) => {
    classAssignmentsByTeacherId.set(String(assignment.teacherId), assignment);
  });

  subjectAssignments.forEach((assignment) => {
    const key = String(assignment.teacherId);
    const current = subjectAssignmentsByTeacherId.get(key) || [];
    current.push(assignment);
    subjectAssignmentsByTeacherId.set(key, current);
  });

  return { classAssignmentsByTeacherId, subjectAssignmentsByTeacherId };
};

const formatClassAssignment = (assignment) => {
  if (!assignment?.sectionId) {
    return null;
  }

  const gradeName = assignment.sectionId.gradeId?.name || null;
  const sectionName = assignment.sectionId.name || null;

  return {
    assignmentId: assignment._id,
    academicYearId: assignment.academicYearId,
    gradeId: assignment.sectionId.gradeId?._id || null,
    gradeName,
    sectionId: assignment.sectionId._id,
    sectionName,
    classDisplayName:
      gradeName && sectionName ? `${gradeName} - ${sectionName}` : sectionName,
  };
};

const formatSubjectAssignments = (assignments = []) =>
  assignments.map((assignment) => ({
    assignmentId: assignment._id,
    academicYearId: assignment.academicYearId,
    subjectId: assignment.subjectId?._id || null,
    subjectName: assignment.subjectId?.name || null,
    sectionId: assignment.sectionId?._id || null,
    sectionName: assignment.sectionId?.name || null,
    gradeId: assignment.sectionId?.gradeId?._id || null,
    gradeName: assignment.sectionId?.gradeId?.name || null,
  }));

const listTeachers = async ({ academicYearId, status } = {}) => {
  const query = {};

  if (status) {
    query.status = status;
  }

  const teachers = await Teacher.find(query)
    .sort({ createdAt: -1 })
    .populate("userId", "username role status");

  const { classAssignmentsByTeacherId, subjectAssignmentsByTeacherId } =
    await buildTeacherAssignmentMaps(academicYearId);

  return teachers.map((teacher) => {
    const userId = teacher.userId?._id || teacher.userId;
    const teacherKey = String(userId);
    const classAssignment = formatClassAssignment(
      classAssignmentsByTeacherId.get(teacherKey),
    );
    const subjectAssignments = formatSubjectAssignments(
      subjectAssignmentsByTeacherId.get(teacherKey) || [],
    );

    return {
      _id: teacher._id,
      teacherId: teacher._id,
      userId,
      username: teacher.userId?.username || null,
      fullName: teacher.fullName,
      highestQualification: teacher.highestQualification,
      qualificationDetail: teacher.qualificationDetail,
      status: teacher.userId?.status || teacher.status,
      isClassTeacher: Boolean(classAssignment),
      classTeacherAssignment: classAssignment,
      assignmentLabel: classAssignment?.classDisplayName || "Subject Teacher",
      subjectAssignments,
      subjectAssignmentCount: subjectAssignments.length,
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
    };
  });
};

module.exports = {
  createTeacher,
  listTeachers,
  TeacherValidationError,
  TeacherUsernameGenerationError,
};
