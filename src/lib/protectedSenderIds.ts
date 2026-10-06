/**
 * Sender IDs that use a brand the client may not own. The NCC and the
 * networks refuse Sender IDs that impersonate banks, telcos, fintechs or
 * government bodies, and a refused request can put the whole route at risk.
 *
 * A match does not block the request. It flags it for the admin, who must
 * check the client actually owns the brand (CAC certificate, letter of
 * authority) before approving it on any network.
 */

// Brands of four or more characters match anywhere in the Sender ID
// ("GTBANKALERT", "MYOPAY"). Shorter ones only match on their own or with a
// typical suffix, so "GLOBALTECH" is not mistaken for Glo.
const LONG_BRANDS = [
  // Banks
  "GTBANK", "GTCO", "GUARANTY", "ACCESSBANK", "ZENITH", "FIRSTBANK", "FIDELITY", "FCMB", "UNIONBANK",
  "STERLING", "STANBIC", "ECOBANK", "WEMA", "ALAT", "POLARIS", "KEYSTONE", "HERITAGE", "UNITYBANK",
  "PROVIDUS", "JAIZ", "TITANTRUST", "GLOBUS", "SUNTRUST", "PREMIUMTRUST", "PARALLEX", "OPTIMUS",
  // Fintechs and payments
  "OPAY", "PALMPAY", "MONIEPOINT", "KUDA", "PAYSTACK", "FLUTTERWAVE", "INTERSWITCH", "QUICKTELLER",
  "PAGA", "FAIRMONEY", "CARBON", "REMITA", "VERVE", "MASTERCARD", "VISA", "CHIPPER", "PIGGYVEST", "COWRYWISE",
  // Telcos and ISPs
  "AIRTEL", "GLOBACOM", "9MOBILE", "ETISALAT", "SMILE", "SPECTRANET", "STARLINK",
  // Government and regulators
  "EFCC", "FIRS", "NIMC", "NDLEA", "POLICE", "INEC", "JAMB", "WAEC", "NECO", "NIPOST", "FRSC", "NAFDAC",
  "CUSTOMS", "IMMIGRATION", "FMBN", "NNPC", "NDIC", "SEC", "PENCOM", "NHIA", "NSITF", "PRESIDENCY", "FEDGOV",
  // Large consumer brands often spoofed
  "DSTV", "GOTV", "MULTICHOICE", "JUMIA", "KONGA", "BET9JA", "SPORTYBET", "DANGOTE",
];
const SHORT_BRANDS = ["MTN", "GLO", "UBA", "FBN", "CBN", "NCC", "CAC", "NIS", "NPF", "T2"];
const SHORT_SUFFIXES = ["", "NG", "NIG", "NGR", "BANK", "PAY", "ALERT", "ALERTS", "INFO", "OTP", "CARE", "PLC", "HQ", "GOV"];

/**
 * The protected brand this Sender ID appears to use, or null. Matching
 * ignores case, spaces and punctuation.
 */
export function matchProtectedBrand(requestedName: string): string | null {
  const name = requestedName.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!name) return null;

  const long = LONG_BRANDS.find((b) => b.length >= 4 && name.includes(b));
  if (long) return long;

  for (const brand of SHORT_BRANDS) {
    for (const suffix of SHORT_SUFFIXES) {
      if (name === brand + suffix || name === "MY" + brand + suffix) return brand;
    }
  }

  // Three letter entries in LONG_BRANDS (SEC) behave like short brands.
  const shortInLong = LONG_BRANDS.filter((b) => b.length < 4).find((b) =>
    SHORT_SUFFIXES.some((suffix) => name === b + suffix)
  );
  return shortInLong ?? null;
}
