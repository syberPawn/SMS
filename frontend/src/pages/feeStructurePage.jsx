import { useEffect, useMemo, useState } from "react";
import { fetchAcademicYears } from "../api/academicYear.api";
import { fetchAdminOverview } from "../api/analytics.api";
import { fetchStudentsByEnrollment } from "../api/enrollment.api";
import {
  createFeeStructure,
  fetchFeeStructures,
  fetchSectionFeeSummary,
  recordPayment,
} from "../api/fee.api";
import { fetchGradesByYear } from "../api/grade.api";
import { fetchSectionsByGrade } from "../api/section.api";
import "./feeManagementPage.css";

const formatMonthLabel = (monthValue) =>
  new Date(`${monthValue}-01`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

const sortByName = (items, key = "name") =>
  [...items].sort((left, right) =>
    String(left[key] || "").localeCompare(String(right[key] || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

const buildAcademicMonths = (academicYear) => {
  if (!academicYear?.startDate || !academicYear?.endDate) {
    return [];
  }

  const startDate = new Date(academicYear.startDate);
  const endDate = new Date(academicYear.endDate);
  const months = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endCursor = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= endCursor) {
    months.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
};

function FeeStructurePage() {
  const today = new Date().toISOString().slice(0, 10);

  const [academicYear, setAcademicYear] = useState(null);
  const [grades, setGrades] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [students, setStudents] = useState([]);
  const [overview, setOverview] = useState(null);
  const [chartRows, setChartRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSearchFocused, setStudentSearchFocused] = useState(false);
  const [admissionSearch, setAdmissionSearch] = useState("");
  const [admissionSearchFocused, setAdmissionSearchFocused] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    gradeId: "",
    sectionId: "",
    enrollmentId: "",
    month: "",
  });

  const [structureForm, setStructureForm] = useState({
    gradeId: "",
    monthlyAmount: "",
  });

  const paymentSections = useMemo(
    () =>
      sortByName(
        allSections.filter((section) => section.gradeId === paymentForm.gradeId),
      ),
    [allSections, paymentForm.gradeId],
  );

  const studentSuggestions = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    if (!query) {
      return students.slice(0, 8);
    }

    return students
      .filter((student) => {
        const name = String(student.fullName || "").toLowerCase();
        const admissionNumber = String(student.admissionNumber || "").toLowerCase();
        return name.includes(query) || admissionNumber.includes(query);
      })
      .slice(0, 8);
  }, [studentSearch, students]);

  const admissionSuggestions = useMemo(() => {
    const query = admissionSearch.trim().toLowerCase();

    if (!query) {
      return students.slice(0, 8);
    }

    return students
      .filter((student) => {
        const admissionNumber = String(student.admissionNumber || "").toLowerCase();
        const name = String(student.fullName || "").toLowerCase();
        return admissionNumber.includes(query) || name.includes(query);
      })
      .slice(0, 8);
  }, [admissionSearch, students]);

  const academicMonths = useMemo(
    () => buildAcademicMonths(academicYear),
    [academicYear],
  );

  const statCards = useMemo(() => {
    const totalStudents = overview?.totalActiveStudents || 0;
    const totalTeachers = overview?.totalActiveTeachers || 0;
    const presentToday = overview?.totalPresentStudents ?? 0;
    const absentToday = Math.max(totalStudents - presentToday, 0);

    return [
      {
        label: "Students",
        value: String(totalStudents).padStart(4, "0"),
        toneClass: "purple",
      },
      {
        label: "Teachers",
        value: String(totalTeachers).padStart(3, "0"),
        toneClass: "gold",
      },
      {
        label: "Present Today",
        value: String(presentToday).padStart(4, "0"),
        toneClass: "purple",
      },
      {
        label: "Absent",
        value: String(absentToday).padStart(4, "0"),
        toneClass: "gold",
      },
    ];
  }, [overview]);

  const selectedFeeStructure = useMemo(() => {
    if (!academicYear?._id || !paymentForm.gradeId) {
      return null;
    }

    return (
      feeStructures.find(
        (structure) =>
          structure.academicYearId?._id === academicYear._id &&
          structure.gradeId?._id === paymentForm.gradeId,
      ) || null
    );
  }, [academicYear, feeStructures, paymentForm.gradeId]);

  const loadWorkspace = async (activeYear) => {
    const [overviewData, gradeData, structureData] = await Promise.all([
      fetchAdminOverview(today, activeYear._id),
      fetchGradesByYear(activeYear._id),
      fetchFeeStructures({ academicYearId: activeYear._id }),
    ]);

    const activeGrades = sortByName(
      gradeData.filter((grade) => grade.status === "ACTIVE"),
    );
    setOverview(overviewData);
    setGrades(activeGrades);
    setFeeStructures(Array.isArray(structureData) ? structureData : []);

    const sectionGroups = await Promise.all(
      activeGrades.map(async (grade) => {
        const sectionData = await fetchSectionsByGrade(grade._id);
        return sectionData
          .filter((section) => section.status === "ACTIVE")
          .map((section) => ({
            ...section,
            gradeName: grade.name,
          }));
      }),
    );

    setAllSections(
      sortByName(sectionGroups.flat().map((section) => ({
        ...section,
        label: `${section.gradeName} ${section.name}`,
      })), "label"),
    );

    setPaymentForm((current) => ({
      ...current,
      month: current.month || buildAcademicMonths(activeYear)[0] || "",
    }));
  };

  const loadStudents = async (sectionId) => {
    if (!academicYear?._id || !sectionId) {
      setStudents([]);
      return;
    }

    try {
      const data = await fetchStudentsByEnrollment({
        academicYearId: academicYear._id,
        sectionId,
      });
      setStudents(sortByName(data, "fullName"));
    } catch (error) {
      console.error("Failed to load students", error);
      setStudents([]);
    }
  };

  const loadChartRows = async (month) => {
    if (!month || !allSections.length) {
      setChartRows([]);
      return;
    }

    try {
      const results = await Promise.all(
        allSections.map(async (section) => {
          try {
            const summary = await fetchSectionFeeSummary({
              sectionId: section._id,
              month,
            });
            const total = (summary.paidCount || 0) + (summary.unpaidCount || 0);
            const paidRate = total > 0 ? (summary.paidCount / total) * 100 : 0;

            return {
              ...section,
              paidCount: summary.paidCount || 0,
              unpaidCount: summary.unpaidCount || 0,
              paidRate,
            };
          } catch {
            return {
              ...section,
              paidCount: 0,
              unpaidCount: 0,
              paidRate: 0,
            };
          }
        }),
      );

      setChartRows(results);
    } catch (error) {
      console.error("Failed to load section fee summary chart", error);
      setChartRows([]);
    }
  };

  useEffect(() => {
    const bootstrapPage = async () => {
      setLoading(true);

      try {
        const years = await fetchAcademicYears({ status: "ACTIVE" });
        const activeYear = years[0] || null;

        if (!activeYear?._id) {
          setFeedback({
            type: "error",
            message: "No active academic year found. Activate one to manage fees.",
          });
          return;
        }

        setAcademicYear(activeYear);
        await loadWorkspace(activeYear);
      } catch (error) {
        console.error("Failed to bootstrap fee workspace", error);
        setFeedback({
          type: "error",
          message: "Failed to load the fee workspace.",
        });
      } finally {
        setLoading(false);
      }
    };

    bootstrapPage();
  }, []);

  useEffect(() => {
    if (!paymentForm.sectionId) {
      setStudents([]);
      return;
    }

    loadStudents(paymentForm.sectionId);
  }, [academicYear, paymentForm.sectionId]);

  useEffect(() => {
    if (!paymentForm.month) {
      setChartRows([]);
      return;
    }

    loadChartRows(paymentForm.month);
  }, [allSections, paymentForm.month]);

  const handlePaymentFormChange = (field, value) => {
    setPaymentForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetStudentSearch = () => {
    setStudentSearch("");
    setStudentSearchFocused(false);
    setAdmissionSearch("");
    setAdmissionSearchFocused(false);
  };

  const selectPaymentStudent = (student) => {
    setPaymentForm((current) => ({
      ...current,
      enrollmentId: student.enrollmentId,
    }));
    setStudentSearch(student.fullName || "");
    setAdmissionSearch(student.admissionNumber || "");
    setStudentSearchFocused(false);
    setAdmissionSearchFocused(false);
  };

  const handleStructureFormChange = (field, value) => {
    setStructureForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleRecordPayment = async (event) => {
    event.preventDefault();

    if (!paymentForm.enrollmentId || !paymentForm.month || !selectedFeeStructure) {
      setFeedback({
        type: "error",
        message: "Select class, section, student, and month before recording payment.",
      });
      return;
    }

    setSaving("payment");
    setFeedback({ type: "", message: "" });

    try {
      await recordPayment({
        enrollmentId: paymentForm.enrollmentId,
        month: paymentForm.month,
        amount: selectedFeeStructure.monthlyAmount,
      });

      setFeedback({
        type: "success",
        message: "Payment recorded successfully.",
      });

      setPaymentForm((current) => ({
        ...current,
        enrollmentId: "",
      }));
      resetStudentSearch();

      await loadChartRows(paymentForm.month);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to record payment.",
      });
    } finally {
      setSaving("");
    }
  };

  const handleCreateStructure = async (event) => {
    event.preventDefault();

    if (!academicYear?._id || !structureForm.gradeId || !structureForm.monthlyAmount) {
      setFeedback({
        type: "error",
        message: "Select a class and amount before creating a fee structure.",
      });
      return;
    }

    setSaving("structure");
    setFeedback({ type: "", message: "" });

    try {
      await createFeeStructure({
        academicYearId: academicYear._id,
        gradeId: structureForm.gradeId,
        monthlyAmount: Number(structureForm.monthlyAmount),
      });

      setFeedback({
        type: "success",
        message: "Fee structure created successfully.",
      });

      setStructureForm({
        gradeId: "",
        monthlyAmount: "",
      });

      const updatedStructures = await fetchFeeStructures({
        academicYearId: academicYear._id,
      });
      setFeeStructures(Array.isArray(updatedStructures) ? updatedStructures : []);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to create fee structure.",
      });
    } finally {
      setSaving("");
    }
  };

  if (loading) {
    return <div className="fees-empty">Loading fee workspace...</div>;
  }

  return (
    <div className="fees-dashboard">
      <div className="fees-main">
        <section className="fees-stat-grid">
          {statCards.map((card) => (
            <article className={`fees-stat-card ${card.toneClass}`} key={card.label}>
              <span className="fees-stat-plus">+</span>
              <h3>{card.value}</h3>
              <p>{card.label}</p>
            </article>
          ))}
        </section>

        <section className="fees-panel-card">
          <div className="fees-panel-head">
            <h3>Fee Payments</h3>
          </div>

          {feedback.message ? (
            <p className={`fees-feedback ${feedback.type}`}>{feedback.message}</p>
          ) : null}

          <form className="fees-payment-form" onSubmit={handleRecordPayment}>
            <label className="fees-pill-field">
              <span>Class</span>
              <select
                value={paymentForm.gradeId}
                onChange={(event) => {
                  setPaymentForm((current) => ({
                    ...current,
                    gradeId: event.target.value,
                    sectionId: "",
                    enrollmentId: "",
                  }));
                  resetStudentSearch();
                }}
                disabled={!academicYear?._id}
              >
                <option value="">Choose class</option>
                {grades.map((grade) => (
                  <option key={grade._id} value={grade._id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="fees-pill-field">
              <span>Section</span>
              <select
                value={paymentForm.sectionId}
                onChange={(event) => {
                  setPaymentForm((current) => ({
                    ...current,
                    sectionId: event.target.value,
                    enrollmentId: "",
                  }));
                  resetStudentSearch();
                }}
                disabled={!paymentForm.gradeId}
              >
                <option value="">Choose section</option>
                {paymentSections.map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="fees-pill-field fees-student-search">
              <span>Student</span>
              <div className="fees-autocomplete">
                <input
                  type="search"
                  value={studentSearch}
                  onChange={(event) => {
                    setStudentSearch(event.target.value);
                    setAdmissionSearch("");
                    setPaymentForm((current) => ({
                      ...current,
                      enrollmentId: "",
                    }));
                  }}
                  onFocus={() => setStudentSearchFocused(true)}
                  onBlur={() => setStudentSearchFocused(false)}
                  placeholder={
                    paymentForm.sectionId ? "Search student name" : "Choose class first"
                  }
                  disabled={!paymentForm.sectionId}
                  autoComplete="off"
                  required
                />

                {studentSearchFocused && paymentForm.sectionId ? (
                  <div className="fees-suggestion-list">
                    {studentSuggestions.length > 0 ? (
                      studentSuggestions.map((student) => (
                        <button
                          type="button"
                          className="fees-suggestion-item"
                          key={student.enrollmentId}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectPaymentStudent(student)}
                        >
                          <strong>{student.fullName}</strong>
                          <span>{student.admissionNumber || "No admission number"}</span>
                        </button>
                      ))
                    ) : (
                      <div className="fees-suggestion-empty">No students found.</div>
                    )}
                  </div>
                ) : null}
              </div>
            </label>

            <label className="fees-pill-field">
              <span>Admission Number</span>
              <div className="fees-autocomplete">
                <input
                  type="search"
                  value={admissionSearch}
                  onChange={(event) => {
                    const value = event.target.value;
                    const exactMatch = students.find(
                      (student) =>
                        String(student.admissionNumber || "").toLowerCase() ===
                        value.trim().toLowerCase(),
                    );

                    setAdmissionSearch(value);
                    setStudentSearch("");
                    setPaymentForm((current) => ({
                      ...current,
                      enrollmentId: exactMatch?.enrollmentId || "",
                    }));

                    if (exactMatch) {
                      setStudentSearch(exactMatch.fullName || "");
                    }
                  }}
                  onFocus={() => setAdmissionSearchFocused(true)}
                  onBlur={() => setAdmissionSearchFocused(false)}
                  placeholder={
                    paymentForm.sectionId
                      ? "Search admission number"
                      : "Choose class first"
                  }
                  disabled={!paymentForm.sectionId}
                  autoComplete="off"
                  required
                />

                {admissionSearchFocused && paymentForm.sectionId ? (
                  <div className="fees-suggestion-list">
                    {admissionSuggestions.length > 0 ? (
                      admissionSuggestions.map((student) => (
                        <button
                          type="button"
                          className="fees-suggestion-item"
                          key={student.enrollmentId}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectPaymentStudent(student)}
                        >
                          <strong>{student.admissionNumber || "No admission number"}</strong>
                          <span>{student.fullName}</span>
                        </button>
                      ))
                    ) : (
                      <div className="fees-suggestion-empty">No students found.</div>
                    )}
                  </div>
                ) : null}
              </div>
            </label>

            <label className="fees-pill-field">
              <span>Month</span>
              <select
                value={paymentForm.month}
                onChange={(event) => handlePaymentFormChange("month", event.target.value)}
              >
                <option value="">Choose month</option>
                {academicMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="fees-pay-button"
              type="submit"
              disabled={
                !paymentForm.enrollmentId ||
                !paymentForm.month ||
                !selectedFeeStructure ||
                saving === "payment"
              }
            >
              {saving === "payment" ? "Paying..." : "Pay"}
            </button>
          </form>
        </section>

        <section className="fees-panel-card">
          <div className="fees-panel-head">
            <h3>Class Wise fee Summary</h3>
            <label className="fees-month-chip">
              <span>Month</span>
              <select
                value={paymentForm.month}
                onChange={(event) => handlePaymentFormChange("month", event.target.value)}
              >
                {academicMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="fees-chart-card">
            {chartRows.map((row) => (
              <article className="fees-chart-bar" key={row._id}>
                <div className="fees-chart-column">
                  <span
                    className={`fees-chart-fill ${row.paidRate < 50 ? "low" : ""}`}
                    style={{ height: `${Math.max(row.paidRate, 10)}%` }}
                  />
                </div>
                <strong>{`${row.gradeName} ${row.name}`}</strong>
              </article>
            ))}

            {chartRows.length === 0 ? (
              <div className="fees-empty compact">No section summary available.</div>
            ) : null}
          </div>
        </section>
      </div>

      <aside className="fees-side">
        <section className="fees-panel-card">
          <div className="fees-panel-head">
            <h3>Define fee Structure</h3>
          </div>

          <form className="fees-structure-form" onSubmit={handleCreateStructure}>
            <label className="fees-stack-field">
              <span>Class</span>
              <select
                value={structureForm.gradeId}
                onChange={(event) =>
                  handleStructureFormChange("gradeId", event.target.value)
                }
              >
                <option value="">Choose class</option>
                {grades.map((grade) => (
                  <option key={grade._id} value={grade._id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="fees-stack-field">
              <span>Amount</span>
              <input
                type="number"
                min="1"
                value={structureForm.monthlyAmount}
                onChange={(event) =>
                  handleStructureFormChange("monthlyAmount", event.target.value)
                }
                placeholder="Enter monthly fee"
              />
            </label>

            <div className="fees-structure-actions">
              <button
                className="fees-create-button"
                type="submit"
                disabled={saving === "structure"}
              >
                {saving === "structure" ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </section>

        <section className="fees-panel-card">
          <div className="fees-panel-head">
            <h3>Fee Structure</h3>
          </div>

          <div className="fees-structure-list">
            <div className="fees-structure-head">
              <span>Class</span>
              <span>Monthly fees</span>
            </div>

            <div className="fees-structure-scroll">
              {feeStructures.map((structure) => (
                <article className="fees-structure-row" key={structure._id}>
                  <span>{structure.gradeId?.name || "N/A"}</span>
                  <strong>{`Rs. ${structure.monthlyAmount}`}</strong>
                </article>
              ))}

              {feeStructures.length === 0 ? (
                <div className="fees-empty compact">No fee structures available.</div>
              ) : null}
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}

export default FeeStructurePage;
