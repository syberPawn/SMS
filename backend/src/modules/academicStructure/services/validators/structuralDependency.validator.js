const Section = require("../../models/section.model");
const GradeSubjectMapping = require("../../models/gradeSubjectMapping.model");

/*
  =====================================
  Structural Dependency Errors
  =====================================
*/
// const {
//   StructuralDependencyError,
// } = require("../services/validators/structuralDependency.validator");

class StructuralDependencyError extends Error {}

/*
  =====================================
  Operational Hook Registry
  =====================================
  Operational modules may register validation hooks.
  AcademicStructure must NOT import operational modules.
*/

let operationalValidators = {
  validateSectionHasNoActiveEnrollments: null,
  validateSectionHasNoActiveTeacherAssignments: null,
  validateMappingHasNoOperationalUsage: null,
  validateYearHasNoActiveOperationalData: null,
};

const registerOperationalValidators = (validators) => {
  operationalValidators = {
    ...operationalValidators,
    ...validators,
  };
};

/*
  =====================================
  Structural Validators
  =====================================
*/

const validateGradeHasNoActiveSections = async (gradeId) => {
  const activeSection = await Section.findOne({
    gradeId,
    status: "ACTIVE",
  });

  if (activeSection) {
    throw new StructuralDependencyError(
      "Cannot deactivate grade: Active sections exist",
    );
  }
};

const validateGradeHasNoActiveMappings = async (gradeId) => {
  const activeMapping = await GradeSubjectMapping.findOne({
    gradeId,
    status: "ACTIVE",
  });

  if (activeMapping) {
    throw new StructuralDependencyError(
      "Cannot deactivate grade: Active curriculum mappings exist",
    );
  }
};

const validateSectionHasNoActiveEnrollments = async (sectionId) => {
  if (operationalValidators.validateSectionHasNoActiveEnrollments) {
    await operationalValidators.validateSectionHasNoActiveEnrollments(
      sectionId,
    );
  }
};
const validateSectionHasNoActiveTeacherAssignments = async (sectionId) => {
  if (operationalValidators.validateSectionHasNoActiveTeacherAssignments) {
    await operationalValidators.validateSectionHasNoActiveTeacherAssignments(
      sectionId,
    );
  }
};

const validateMappingHasNoOperationalUsage = async (mappingId) => {
  if (operationalValidators.validateMappingHasNoOperationalUsage) {
    await operationalValidators.validateMappingHasNoOperationalUsage(mappingId);
  }
};

const validateYearHasNoActiveOperationalData = async (yearId) => {
  if (operationalValidators.validateYearHasNoActiveOperationalData) {
    await operationalValidators.validateYearHasNoActiveOperationalData(yearId);
  }
};

module.exports = {
  StructuralDependencyError,
  registerOperationalValidators,

  validateGradeHasNoActiveSections,
  validateGradeHasNoActiveMappings,
  validateSectionHasNoActiveEnrollments,
  validateSectionHasNoActiveTeacherAssignments,
  validateMappingHasNoOperationalUsage,
  validateYearHasNoActiveOperationalData,
};
