const RepeaterCollection = require('./repeater-collection');

const globalCollection = new RepeaterCollection();

globalCollection.RepeaterCollection = RepeaterCollection;

module.exports = globalCollection;
