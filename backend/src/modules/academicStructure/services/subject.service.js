const Subject = require("../models/subject.model");
const {
  StructuralDependencyError,
} = require("./validators/structuralDependency.validator");
/*
  =====================================
  Subject Domain Errors
  =====================================
*/

class SubjectNotFoundError extends Error {}
class DuplicateSubjectError extends Error {}
class SubjectValidationError extends Error {}

/*
  =====================================
  SubjectService
  =====================================
*/

const createSubject = async (data, adminId) => {
  const { name, code } = data;

  // 1️⃣ Required validation
  if (!name) {
    throw new SubjectValidationError("Subject name is required");
  }

  try {
    // 2️⃣ Create subject
    const subject = await Subject.create({
      name,
      code,
      status: "ACTIVE",
      createdBy: adminId,
      updatedBy: adminId,
    });

    return subject;
  } catch (error) {
    // 3️⃣ Duplicate key handling
    if (error.code === 11000) {
      throw new DuplicateSubjectError("Subject name or code must be unique");
    }

    throw error;
  }
};

const deactivateSubject = async (subjectId) => {
  // 1️⃣ Validate subject exists
  const subject = await Subject.findById(subjectId);

  if (!subject) {
    throw new SubjectNotFoundError("Subject not found");
  }

  // 2️⃣ Idempotent behavior
  if (subject.status === "INACTIVE") {
    return subject;
  }

  // 3️⃣ Soft deactivate
  subject.status = "INACTIVE";

  await subject.save();

  return subject;
};

const activateSubject = async (subjectId) => {
  // 1️⃣ Validate subject exists
  const subject = await Subject.findById(subjectId);

  if (!subject) {
    throw new SubjectNotFoundError("Subject not found");
  }

  // 2️⃣ Idempotent behavior
  if (subject.status === "ACTIVE") {
    return subject;
  }

  // 3️⃣ Activate
  subject.status = "ACTIVE";

  await subject.save();

  return subject;
};

const listSubjects = async () => {
  return Subject.find().sort({ name: 1 });
};

module.exports = {
  createSubject,
  deactivateSubject,
  activateSubject,
  listSubjects,

  SubjectNotFoundError,
  DuplicateSubjectError,
  SubjectValidationError,
  StructuralDependencyError,
};
