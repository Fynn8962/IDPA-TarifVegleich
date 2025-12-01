exports.calculateCost = (plan, user) => {
  const minutesExtra = Math.max(0, user.minutes - plan.includedMinutes);
  const smsExtra = Math.max(0, user.sms - plan.includedSMS);
  const dataExtra = Math.max(0, user.dataMB - plan.includedDataMB);

  return (
    plan.priceBase +
    minutesExtra * plan.pricePerMinute +
    smsExtra * plan.pricePerSMS +
    dataExtra * plan.pricePerMB
  );
};

exports.getReason = (plan, user) => {
  return "Geringe Gesamtkosten basierend auf Ihrem Verbrauch.";
};
