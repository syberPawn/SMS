const Student = require("../models/students.model");
const Enrollment = require("../models/enrollments.model");

const AcademicYear = require("../../academicStructure/models/academicYear.model");
const Section = require("../../academicStructure/models/section.model");
const Grade = require("../../academicStructure/models/grade.model");
const User = require("../../user/models/user.model");
const { createUser } = require("../../user/services/user.service");

const {
  AdmissionNumberAlreadyExistsError,
  StudentIdentityValidationError,
} = require("./studentIdentity.service");

const {
  AcademicYearNotFoundError,
  AcademicYearNotActiveError,
  AcademicYearInactiveWindowError,
  SectionNotFoundError,
  SectionAcademicYearMismatchError,
} = require("./studentEnrollment.service");

const genderEnum = ["MALE", "FEMALE", "OTHER"];

const validateAcademicYearIsActive = (academicYear) => {
  if (!academicYear) {
    throw new AcademicYearNotFoundError("Academic year not found");
  }

  if (academicYear.status !== "ACTIVE") {
    throw new AcademicYearNotActiveError("Academic year is not ACTIVE");
  }

  const now = new Date();
  if (now < academicYear.startDate || now > academicYear.endDate) {
    throw new AcademicYearInactiveWindowError(
      "Current date is outside academic year window",
    );
  }
};

const createStudentWithEnrollment = async (data, adminId) => {
  const {
    fullName,
    dateOfBirth,
    gender,
    admissionNumber,
    academicYearId,
    sectionId,
  } = data;

  if (
    !fullName ||
    !dateOfBirth ||
    !gender ||
    !admissionNumber ||
    !academicYearId ||
    !sectionId
  ) {
    throw new StudentIdentityValidationError(
      "Missing required student identity or enrollment fields",
    );
  }

  if (!genderEnum.includes(gender)) {
    throw new StudentIdentityValidationError("Invalid gender");
  }

  const existingAdmission = await Student.findOne({ admissionNumber });
  if (existingAdmission) {
    throw new AdmissionNumberAlreadyExistsError(
      "Admission number already exists",
    );
  }

  const academicYear = await AcademicYear.findById(academicYearId);
  validateAcademicYearIsActive(academicYear);

  const section = await Section.findById(sectionId);
  if (!section) {
    throw new SectionNotFoundError("Section not found");
  }

  const grade = await Grade.findById(section.gradeId);
  if (!grade) {
    throw new SectionAcademicYearMismatchError("Invalid section hierarchy");
  }

  if (grade.academicYearId.toString() !== academicYearId.toString()) {
    throw new SectionAcademicYearMismatchError(
      "Section does not belong to provided academic year",
    );
  }

  const adminContext = {
    userId: adminId,
    role: "ADMIN",
  };

  const username = admissionNumber;
  const password = new Date(dateOfBirth)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  let user = null;
  let student = null;

  try {
    user = await createUser(adminContext, {
      username,
      password,
      role: "STUDENT",
    });

    student = await Student.create({
      userId: user.userId,
      fullName,
      dateOfBirth,
      gender,
      admissionNumber,
      identityStatus: "ACTIVE",
    });

    const enrollment = await Enrollment.create({
      studentId: student._id,
      academicYearId,
      sectionId,
      enrollmentStatus: "ACTIVE",
    });

    return {
      student,
      enrollment,
    };
  } catch (error) {
    if (student?._id) {
      await Enrollment.deleteMany({ studentId: student._id });
      await Student.deleteOne({ _id: student._id });
    }

    if (user?.userId) {
      await User.deleteOne({ _id: user.userId });
    }

    throw error;
  }
};

module.exports = {
  createStudentWithEnrollment,
};
