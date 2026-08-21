const STUDIO = {
  name: "Artistic Edge Dance Center",
  shortName: "AEDC",
  tagline: "Dance with an edge.",
  city: "Greenville, SC",
  address: "75 Orchard Park Drive",
  cityStateZip: "Greenville, SC 29615",
  phone: "864-631-2156",
  phoneHref: "tel:8646312156",
  email: "dance@artisticedgedance.com",
  emailHref: "mailto:dance@artisticedgedance.com",
  instagram: "https://www.instagram.com/danceaedc/",
  facebook: "https://www.facebook.com/ArtisticEdgeDanceCenter/",
  maps: "https://maps.google.com/?q=75+Orchard+Park+Drive+Greenville+SC+29615",
  attireShop: "http://www.thesockbasket.com/greenville-sc.html",
  attireShopName: "The Sock Basket",
  attireShopAddress: "2433 Laurens Rd, Greenville, SC 29607",
  discountDance: "https://discountdance.com",
  portalExternal: "https://app.gostudiopro.com/online/aedc",
  hours: {
    frontDesk: "Monday–Thursday, 3:00–7:30pm",
    summerOffice: "Monday–Thursday, 9:00am–1:00pm",
  },
  season: "2026–27",
  seasonRange: "mid-August through mid-May",
};

const AGE_BANDS = [
  { id: "2-3", label: "Ages 2–3", hint: "First steps", min: 2, max: 3 },
  { id: "3-4", label: "Ages 3–4", hint: "Preschool", min: 3, max: 4 },
  { id: "5-6", label: "Ages 5–6", hint: "Combo", min: 5, max: 6 },
  { id: "7-9", label: "Ages 7–9", hint: "Technique", min: 7, max: 9 },
  { id: "10-12", label: "Ages 10–12", hint: "Level up", min: 10, max: 12 },
  { id: "13-17", label: "Ages 13–17", hint: "Teen", min: 13, max: 17 },
  { id: "18+", label: "Adult", hint: "Open", min: 18, max: 99 },
];


module.exports = { STUDIO, AGE_BANDS };
