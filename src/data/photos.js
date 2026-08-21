// Real studio photography.
// Source: the studio's own public site gallery (squarespace-cdn). For the
// pitch/demo we hotlink; for production hand-off, drop optimized files into
// /public/images/photos/<key>.jpg and the local file wins automatically.
// See PHOTOS.md.
const fs = require("fs");
const path = require("path");

const CDN = "https://images.squarespace-cdn.com/content/v1/52152b5fe4b0e1dd1c52efcf";
const W = "?format=1000w";

const PHOTOS = {
  company:    { remote: `${CDN}/1759158379565-AKNLNTA0BRCWUVNT7PKJ/Full+Company.jpg${W}`,          alt: "The full Artistic Edge Dance Company on stage" },
  ballet:     { remote: `${CDN}/1759158691169-G17RHAB0HJT4S6Z5TWLD/ballet+-+Copy.jpg${W}`,          alt: "Ballet dancers in formation" },
  nutcracker: { remote: `${CDN}/1759158703684-7XDNZNUSSL5Q7J2O7XG0/Nutcracker.jpg${W}`,             alt: "Nutcracker Sweets performance" },
  nutcracker2:{ remote: `${CDN}/1759158702474-ZD6YGUFW7XKCSG9ER6GF/nutcracker+2+-+Copy.jpg${W}`,    alt: "Nutcracker Sweets cast on stage" },
  acro:       { remote: `${CDN}/1759158882808-QS87VL2JE35CD1H4UUEM/scorpion.jpg${W}`,               alt: "Acro dancer in a scorpion pose" },
  acro2:      { remote: `${CDN}/1759158706355-NLANEJ2OWOUM2AI7NG8D/back+arch.jpg${W}`,              alt: "Dancer in a back arch" },
  preschool:  { remote: `${CDN}/1759158701160-FXYGKDTQ6WLXJ0BGC86E/cuties+at+windo+-+Copy.jpg${W}`, alt: "Preschool dancers at the studio window" },
  contemporary:{ remote: `${CDN}/1759158690664-V71IKJ43PYTK1MY07OOI/love.jpg${W}`,                  alt: "Contemporary dancers" },
  contemporary2:{ remote: `${CDN}/1759158690304-7DSWF2EL6EJPXYSSUSYS/love2.jpg${W}`,                alt: "Contemporary duo" },
  jazz:       { remote: `${CDN}/1759158704935-I5FRJ2XSQKQBFVDSHZVP/Twinning.jpg${W}`,               alt: "Two dancers matching a jazz pose" },
  recital:    { remote: `${CDN}/1759158700262-I8K9QTP6COPBGC2DWO1G/PS.jpg${W}`,                     alt: "Spring performance on stage" },
  candid:     { remote: `${CDN}/1759158705528-3R5VI3VPALQXOTL23T21/cam.jpg${W}`,                    alt: "Dancer mid-performance" },
  wewantyou:  { remote: `${CDN}/1759158705953-MSP1GBPUXORAV9802FJR/we+want+you.jpg${W}`,            alt: "We want you — join the AEDC faculty" },
};

// Local override: /public/images/photos/<key>.jpg (checked once at boot)
const localDir = path.join(__dirname, "..", "..", "public", "images", "photos");
for (const key of Object.keys(PHOTOS)) {
  if (fs.existsSync(path.join(localDir, `${key}.jpg`))) {
    PHOTOS[key].src = `/images/photos/${key}.jpg`;
  } else {
    PHOTOS[key].src = PHOTOS[key].remote;
  }
}

function photo(key) {
  return PHOTOS[key] || null;
}

// Map class styles to real photography, SVG art as fallback.
const STYLE_PHOTO = {
  Ballet: "ballet",
  Jazz: "jazz",
  Tap: "candid",
  "Hip Hop": "candid",
  Contemporary: "contemporary",
  Acro: "acro",
  Combo: "preschool",
  "Creative Movement": "preschool",
};

function classPhoto(klass) {
  const key = STYLE_PHOTO[klass.style];
  return key ? photo(key) : null;
}

module.exports = { PHOTOS, photo, classPhoto };
