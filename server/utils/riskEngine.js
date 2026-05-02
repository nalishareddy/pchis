const Vitals = require('../models/Vitals');
const Medication = require('../models/Medication');

const calculateRisk = async (patientId) => {
  const now = new Date();
  const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  let riskScore = 0;
  const reasons = [];

  const lastVitals = await Vitals.findOne({ patient: patientId }).sort({ createdAt: -1 });

  if (!lastVitals) {
    riskScore += 30;
    reasons.push('No vitals have been recorded yet');
  } else if (lastVitals.createdAt < threeDaysAgo) {
    riskScore += 20;
    reasons.push('Vitals not logged in the last 3 days');
  }

  if (lastVitals?.bp_systolic && lastVitals?.bp_diastolic) {
    if (lastVitals.bp_systolic > 140 || lastVitals.bp_diastolic > 90) {
      riskScore += 30;
      reasons.push(`Elevated BP: ${lastVitals.bp_systolic}/${lastVitals.bp_diastolic} mmHg (hypertension)`);
    } else if (lastVitals.bp_systolic < 90 || lastVitals.bp_diastolic < 60) {
      riskScore += 20;
      reasons.push(`Low BP: ${lastVitals.bp_systolic}/${lastVitals.bp_diastolic} mmHg (hypotension)`);
    }
  }

  if (lastVitals?.blood_sugar) {
    if (lastVitals.blood_sugar > 200) {
      riskScore += 25;
      reasons.push(`High blood sugar: ${lastVitals.blood_sugar} mg/dL`);
    } else if (lastVitals.blood_sugar > 126) {
      riskScore += 15;
      reasons.push(`Elevated blood sugar: ${lastVitals.blood_sugar} mg/dL`);
    }
  }

  const medications = await Medication.find({ patient: patientId });
  let missedMedsCount = 0;

  for (const med of medications) {
    const takenInLast7Days = med.taken.filter(
      (date) => new Date(date) >= sevenDaysAgo
    ).length;
    if (takenInLast7Days < 5) {
      missedMedsCount++;
    }
  }

  if (missedMedsCount > 2) {
    riskScore += 25;
    reasons.push(`Poor medication adherence: ${missedMedsCount} medications missed this week`);
  } else if (missedMedsCount > 0) {
    riskScore += 10;
    reasons.push(`Partial medication adherence: ${missedMedsCount} medication(s) missed`);
  }

  let level;
  if (riskScore >= 50) level = 'High';
  else if (riskScore >= 25) level = 'Medium';
  else level = 'Low';

  return {
    level,
    score: riskScore,
    reasons: reasons.length > 0 ? reasons : ['All vitals and medications are on track'],
    lastVitals: lastVitals
      ? {
          bp: lastVitals.bp_systolic
            ? `${lastVitals.bp_systolic}/${lastVitals.bp_diastolic}`
            : null,
          blood_sugar: lastVitals.blood_sugar || null,
          weight: lastVitals.weight || null,
          date: lastVitals.createdAt
        }
      : null
  };
};

module.exports = { calculateRisk };
