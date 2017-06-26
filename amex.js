const fetch = require("node-fetch");

console.log("American Express");

const baseHeaders = {
  cupcake: "",
  Face: "en_GB",
  clientType: "Android",
  clientVersion: "4.3.0",
  appID: "com.americanexpress.android.acctsvcs.uk",
  oSversion: "4.4.2",
  osBuild: "Android",
  deviceModel: "GT-I9505",
  hardwareID: "8c0bd36d",
  sdkInt: "19",
  manufacturer: "samsung",
  brand: "samsung",
  "Content-Type": "application/json; charset=UTF-8",
  "User-Agent": "okhttp/3.4.2"
};

const auth = async (username, password) => {
  const headers = baseHeaders;
  const body = {
    clientType: "Android",
    clientVersion: "4.3.0",
    deviceCharecteristics: {
      OSVersion: "4.4.2",
      brand: "samsung",
      deviceModel: "GT-I9505",
      hardwareID: "8c0bd36d",
      manufacturer: "samsung",
      sdkInt: 19
    },
    deviceModel: "GT-I9505",
    encryptedKey: "",
    hardwareId: "8c0bd36d",
    locale: "en_GB",
    osBuild: "4.4.2",
    password: process.env.PASSWORD,
    profileInfo: `muid#${process.env.AMEX_MASKED_USERNAME}|rmf#1|kid#1|ed#${process.env.AMEX_PROFILE_INFO}|`,
    timeZoneOffsetInMilli: "3600000",
    user: process.env.AMEX_MASKED_USERNAME,
    userTimeStampInMilli: "1498483403094",
    rememberMe: true,
    sortedIndex: -1
  };

  const response = await fetch(
    "https://global.americanexpress.com/myca/intl/moblclient/emea/services/accountservicing/v1/loginSummary",
    { method: "POST", headers, body: JSON.stringify(body) }
  );

  const json = await response.json();
  return report(json);
};

const report = response => {
  const card = response.summaryData.cardList[0];
  return {
    firstName: response.summaryData.userData.firstName,
    lastName: response.summaryData.userData.lastName,
    card: {
      name: card.cardProductName,
      rewardsBalance: card.loyaltyDetails.displayValue
    },
    cupcake: response.logonData.cupcake
  };
};

const timeline = async cupcake => {
  const headers = Object.assign({}, baseHeaders, { cupcake });
  const body = {
    timestampInMilli: Date.now(),
    timeZoneOffsetInMilli: "3600000",
    localTime: "06-26-2017T11:23:24 PM BST",
    timeZone: "GMT+00:00",
    pendingChargeEnabled: true,
    pushEnabled: true,
    payYourWayEnabled: false,
    payWithPointsEnabled: false,
    goodsSvcOfferEnabled: true,
    cmlEnabled: true,
    sortedIndex: 0
  };

  const response = await fetch(
    "https://global.americanexpress.com/myca/intl/moblclient/emea/svc/v2/timeline.do",
    { method: "POST", headers, body: JSON.stringify(body) }
  );
  const json = await response.json();
  return timelineReport(json);
};

const timelineReport = response => {
  return response.timeline.timelineItems
    .reduce((acc, line) => acc.concat(line.subItems), [])
    .map(line => {
      const extra = response.timeline.transactionMap[line.id];
      return Object.assign(line, extra);
    })
    .filter(line => line.type === "transaction")
    .map(line => ({
      type: line.type,
      subtype: line.transTypeDesc,
      date: line.date,
      title: line.title,
      description: line.description,
      chargeDate: line.chargeDate && line.chargeDate.formattedDate,
      amount: line.amount && line.amount.formattedAmount,
      merchant: line.extendedTransactionDetails && line.extendedTransactionDetails.merchantName,
      address: line.extendedTransactionDetails && line.extendedTransactionDetails.address,
      category: line.category,
      subcategory: line.subcategory
    }))
};

auth()
  .then(x => timeline(x.cupcake))
  .then(x => console.log(x[x.length - 1]))
  .catch(err => console.error(err));
