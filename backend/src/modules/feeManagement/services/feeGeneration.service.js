/*
  ==============================
  DETERMINE ACADEMIC MONTHS
  FR-FEE-02
  ==============================
*/

const determineAcademicMonths = (academicYear) => {
  const startDate = new Date(academicYear.startDate);
  const endDate = new Date(academicYear.endDate);

  const months = [];

  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= endMonth) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");

    months.push(`${year}-${month}`);

    current.setMonth(current.getMonth() + 1);
  }

  return months;
};

/*
  ==============================
  DETERMINE PAYABLE MONTHS
  FR-FEE-03
  ==============================
*/

const determinePayableMonthsForEnrollment = ({
  academicMonths,
  enrollment,
}) => {
  const enrollmentDate = new Date(enrollment.enrollmentDate || enrollment.createdAt);

  const enrollmentMonth = `${enrollmentDate.getFullYear()}-${String(
    enrollmentDate.getMonth() + 1,
  ).padStart(2, "0")}`;

  let terminationMonth = null;

  if (enrollment.terminationDate) {
    const terminationDate = new Date(enrollment.terminationDate);

    terminationMonth = `${terminationDate.getFullYear()}-${String(
      terminationDate.getMonth() + 1,
    ).padStart(2, "0")}`;
  }

  const payableMonths = academicMonths.filter((month) => {
    if (month < enrollmentMonth) {
      return false;
    }

    if (terminationMonth && month > terminationMonth) {
      return false;
    }

    return true;
  });

  return payableMonths;
};

module.exports = {
  determineAcademicMonths,
  determinePayableMonthsForEnrollment,
};
