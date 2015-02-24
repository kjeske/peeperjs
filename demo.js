
var peeper = require('./peeper.js');

var person = {

    Id: 1,
    Name: 'Brad',
    Age: 12
};

var observation = peeper.observe(person, function(o) {
    console.log(o);
});

person.Name = 'Krzysztof';

// Console output:
// { object: {person}, property: 'Name', oldValue: 'Brad', newValue: 'Krzysztof' }

// Dispose an observer
observation.dispose();

person.Age = 33;

// No console output
