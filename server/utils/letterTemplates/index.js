// utils/letterTemplates/index.js
const offerLetterTemplate = require('./offerLetterTemplate');
const appointmentLetterTemplate = require('./appointmentLetterTemplate');
const hikeLetterTemplate = require('./hikeLetterTemplate');
const promotionLetterTemplate = require('./promotionLetterTemplate');
const terminationLetterTemplate = require('./terminationLetterTemplate');
const experienceLetterTemplate = require('./experienceLetterTemplate');

const templates = {
  offer: offerLetterTemplate,
  appointment: appointmentLetterTemplate,
  hike: hikeLetterTemplate,
  promotion: promotionLetterTemplate,
  termination: terminationLetterTemplate,
  experience: experienceLetterTemplate
};

const getTemplate = (letterType, data) => {
  const template = templates[letterType];
  if (!template) {
    throw new Error(`Template not found for letter type: ${letterType}`);
  }
  
  try {
    const result = template(data);
    if (!result || typeof result !== 'string') {
      throw new Error('Template returned invalid result');
    }
    return result;
  } catch (error) {
    console.error(`Template execution error for ${letterType}:`, error);
    throw new Error(`Failed to generate template: ${error.message}`);
  }
};

module.exports = { getTemplate, templates };