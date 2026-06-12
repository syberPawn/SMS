const Student = require("../models/students.model");
const { createUser } = require("../../user/services/user.service");

/*
  ======================================
  Student Identity Domain Errors
  ======================================
*/

class StudentNotFoundError extends Error {}
class AdmissionNumberAlreadyExistsError extends Error {}
class StudentIdentityValidationError extends Error {}
class UnauthorizedStudentProfileAccessError extends Error {}

/*
  ======================================
  StudentIdentityService
  ======================================
*/

/*
  1️⃣ createStudentIdentity
  Implements FR-SM-01
*/
const createStudentIdentity = async (data, adminId) => {
  const { fullName, dateOfBirth, gender, admissionNumber } = data;

  // 1️⃣ Required Validation
  if (!fullName || !dateOfBirth || !gender || !admissionNumber) {
    throw new StudentIdentityValidationError(
      "Missing required student identity fields",
    );
  }

  // 2️⃣ Admission Number Uniqueness (BR-SM-02)
  const existingAdmission = await Student.findOne({ admissionNumber });
  if (existingAdmission) {
    throw new AdmissionNumberAlreadyExistsError(
      "Admission number already exists",
    );
  }

  // Generate username and password for student login
  const username = admissionNumber;
  const password = new Date(dateOfBirth)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  // Build admin context required by user service
  const adminContext = {
    userId: adminId,
    role: "ADMIN",
  };

  // Create USER account for student
  const user = await createUser(adminContext, {
    username,
    password,
    role: "STUDENT",
  });

  // 3️⃣ Create Identity (identityStatus forced to ACTIVE)
  const student = await Student.create({
    userId: user.userId,
    fullName,
    dateOfBirth,
    gender,
    admissionNumber,
    identityStatus: "ACTIVE",
  });

  return student;
};

/*
  2️⃣ updateStudentIdentity
  Implements FR-SM-02
*/
const updateStudentIdentity = async (studentId, data, adminId) => {
  const student = await Student.findById(studentId);

  if (!student) {
    throw new StudentNotFoundError("Student identity not found");
  }

  // Immutable fields protection (BR-SM-09)
  if (
    data.admissionNumber !== undefined ||
    data.dateOfBirth !== undefined ||
    data.identityStatus !== undefined ||
    data._id !== undefined
  ) {
    throw new StudentIdentityValidationError(
      "Attempt to modify immutable student identity fields",
    );
  }

  // Update allowed fields only
  if (data.fullName !== undefined) {
    student.fullName = data.fullName;
  }

  if (data.gender !== undefined) {
    student.gender = data.gender;
  }

  await student.save();

  return student;
};

/*
  3️⃣ deactivateStudentIdentity
  Implements FR-SM-03
*/
const deactivateStudentIdentity = async (studentId, adminId) => {
  const student = await Student.findById(studentId);

  if (!student) {
    throw new StudentNotFoundError("Student identity not found");
  }

  // Soft deactivate only (BR-SM-14)
  student.identityStatus = "INACTIVE";

  await student.save();

  return student;
};

/*
  4️⃣ getStudentProfile
  Implements FR-SM-07
  (Authorization scope enforced at service layer)
*/
const getStudentProfile = async (requester, studentId) => {
  const student = await Student.findById(studentId);

  if (!student) {
    throw new StudentNotFoundError("Student identity not found");
  }

  // Role-based access (DS-SM-08)
  if (requester.role === "ADMIN") {
    return student;
  }

  if (requester.role === "STUDENT") {
    if (requester._id.toString() !== student.userId.toString()) {
      throw new UnauthorizedStudentProfileAccessError(
        "Access denied to student profile",
      );
    }
    return student;
  }

  // TEACHER access validation will be enforced in Enrollment Service
  // (because it requires class-based scope validation)

  return student;
};

/*
  5️⃣ listStudents
  For Enrollment UI
*/
const listStudents = async () => {
  return await Student.find({ identityStatus: "ACTIVE" });
};

module.exports = {
  createStudentIdentity,
  updateStudentIdentity,
  deactivateStudentIdentity,
  getStudentProfile,
  listStudents,

  StudentNotFoundError,
  AdmissionNumberAlreadyExistsError,
  StudentIdentityValidationError,
  UnauthorizedStudentProfileAccessError,
};
