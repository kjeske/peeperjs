(function(root, factory) {

    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.peeper = factory();
    }

}(this, function() {

    // A dictionary of observed objects
    var observables = {};

    // public members
    return {

        observe: observe,

        makeObservable: makeObservable

    };

    /**
     * Converts a plain object to an observable object
     * @param  {object}     obj             Object to convert
     * @param  {Array}      exclusions      Array of property names that should be excluded from the conversion
     */
    function makeObservable(obj, exclusions) {

        // stop exectution if the object already exists in the dictionary of observed objects
        if (observables[obj]) {
            return;
        }

        var exclusionsDictionary = {};

        if (exclusions) {
            // convert array of string to a dictionary to get better performance during the property lookup
            for (var i = 0; i < exclusions.length; i++) {
                exclusionsDictionary[exclusions[i]] = true;
            }
        }

        for (var property in obj) {

            if (!obj.hasOwnProperty(property) || exclusionsDictionary[property] || typeof(obj[property]) === "function") {
                continue;
            }

            persistProperty(obj, property);
        }
    }

    /**
     * Observe the propeties' values changes in the object
     * @param  {object}     An object to observe
     * @param  {Function}   A callback to call when the change happens
     * @return {object}     An object with 'dispose' method to unpin the callback
     */
    function observe(obj, callback) {

        // convert an object to observable if it doesn't exists in the dictionary of observed objects
        if (!observables[obj]) {
            makeObservable(obj);
        }

        // get the subscribers list
        var subscribers = observables[obj].subscribers;

        subscribers.push(callback);

        return {
            dispose: disposeSubscriber.bind(this, subscribers, callback)
        };
    }

    /**
     * Notify object's subscribers about property changes
     * @param  {object}     obj             An object in which property's value has changed
     * @param  {string}     propertyName    Name of the property that has changed
     * @param  {object}     oldValue        Old value
     * @param  {object}     newValue        Current value
     */
    function callSubscribers(obj, propertyName, oldValue, newValue) {

        // perform this action in a (pseudo)async manner
        setTimeout(function() {

            var observable = observables[obj];

            if (!observable || !observable.subscribers) {
                return;
            }

            for (var i = 0; i < observable.subscribers.length; i++) {
                observable.subscribers[i]({
                    object: obj,
                    property: propertyName,
                    oldValue: oldValue,
                    newValue: newValue
                });
            }

        }, 0);
    }

    /**
     * Converts plain property to a proxy property
     * @param  {object}     obj             An object that contains the property
     * @param  {string}     propertyName    Name of the property to convert
     */
    function persistProperty(obj, propertyName) {

        // plain value storage
        var value = obj[propertyName];

        Object.defineProperty(obj, propertyName, {
            get: function() {
                return value;
            },
            set: function(newValue) {
                var oldValue = value;
                value = newValue;

                // notify subscribers that the value has changed
                callSubscribers(obj, propertyName, oldValue, newValue);
            },
            enumerable: true,
            configurable: true
        });

        // add obj to the dictionary of observed objects
        observables[obj] = {

            // initialize an array of subscribers
            subscribers: []

        };

    }

    /**
     * Removes existing subscription callback from object's subscriptions list
     * @param  {Array}      subscribers     A list of existing subscriptions
     * @param  {Function}   callback        A callback function to remove
     */
    function disposeSubscriber(subscribers, callback) {
        
        var index = subscribers.indexOf(callback);

        if (index === -1) {
            return;
        }

        // perform the removal in a (pseudo)async manner
        setTimeout(subscribers.splice.bind(subscribers, index, 1), 0);
    }

}));
