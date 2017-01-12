'use strict';

var about = {
  bethanyImage: 'img[alt="Bethany"]',
  startSurvey: '.l--about__cta-button'
};

var home = {
  bodyShapeImage: name => `//span[text()="${name}"]/preceding-sibling::img`,
  bodyShapeImages: 'img[class*="body-shape"]',
  formalityImages: 'img[class*="formality"]',
  pitchGraphic: '.l--pitch [class*="graphic"]',
  startSurvey: '.l--pitch__button'
};

var shared = {
  facebookImageMeta: 'meta[property="og:image"]',
  facebookTitleMeta: 'meta[property="og:title"]',
  facebookUrlMeta: 'meta[property="og:url"]',
  faviconLink: 'link[rel="shortcut icon"]',
  footerAboutLink: '//footer//a[text()="About Us"]',
  footerHomeLink: '//footer//a[text()="Home"]',
  footerSurveyLink: '//footer//a[text()="Get Started"]',
  headerAboutLink: '//header//a[text()="About Us"]',
  headerSurveyLink: '//header//a[text()="Get Started"]',
  logo: 'header img[alt="Cover Your Basics"]',
  touchIconLink: 'link[rel="apple-touch-icon"]',
  twitterImageMeta: 'meta[name="twitter:image"]'
};

var survey = {
  birthYear: '#survey-birth-year',
  bodyShapeChoice: name => `.c--body-shape__example__caption=${name}`,
  errors: {
    birthYear: '.c--birth-year-picker__error',
    bodyShapes: '.c--body-shape-picker__error',
    formalities: '.c--formality-picker__error',
    sizes: '.c--size-picker__error',
    styles: '.c--style-picker__error'
  },
  form: '#start-survey',
  formalityChoice: (formality, frequency) => `//legend[text()="${formality}"]/..//label[text()="${frequency}"]`,
  sizeChoice: name => `.c--size-picker__size__name=${name}`,
  styleChoice: name => `.c--style-picker__style__label=${name}`,
  styleInput: name => `//label[text()="${name}"]/preceding-sibling::input`
};

var recommendations = {
  backToTopLinks: '.l--recommendations__basic__return-link',
  basic: '.l--recommendations__basic',
  dismissEmail: '.l--registration-pitch__dismiss',
  dismissEmailConfirmation: '.l--registration-pitch__complete__dismiss',
  emailConfirmation: '.l--registration-pitch__complete__text',
  emailError: '.c--registration__error',
  emailForm: '.l--registration-pitch__registration',
  emailInput: '#email',
  emailSubmit: '.c--registration__submit',
  garments: '.c--garment__preview',
  priceGroup: '.c--recommendations__price-group',
  tocGarment: name => `.c--basic-teaser__name=${name}`,
  tocGarments: '.c--basic-teaser__name',
  tocLink: '.c--basic-teaser',
  tocTitle: '.l--recommendations__title__text'
};

module.exports = {
  about: about,
  home: home,
  recommendations: recommendations,
  shared: shared,
  survey: survey
};
