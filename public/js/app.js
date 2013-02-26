Parse.initialize("k9KgB9qPfaE2wpVRTgp5TfqSk0md5nEZnxdMxKON", "F92G71lR49yfRZoimF18IRMMc3Aa52r3nFkGM3zt");

var Student = Parse.Object.extend("Student");
var Action = Parse.Object.extend("Action");

var app = angular.module('StudentDB', ['$strap.directives']);

app.config(function ($routeProvider) {

    $routeProvider
        .when('/students', {
            templateUrl: "students.html",
            controller: 'StudentsController',
            resolve: {
                loadStudents: StudentsController.loadStudents
            }
        })
        .when('/students/new', {
            templateUrl: "student.html",
            controller: 'StudentController'
        })
        .when('/students/:id', {
            templateUrl: "student.html",
            controller: 'StudentController',
            resolve: {
                loadStudent: StudentController.loadStudent,
                loadActions: StudentController.loadActions
            }
        })
        .when('/login', {
            templateUrl: "login.html",
            controller: 'LoginController'
        })
        .when('/signup', {
            templateUrl: "signup.html",
            controller: 'SignUpController'
        })
        .otherwise({
            redirectTo: '/students'
        });
});

var AppController = app.controller('AppController', function ($rootScope, $location) {

    $rootScope.loading = false;

    $rootScope.$on("$routeChangeStart", function (event, next, last) {
        if (!Parse.User.current()) {
            if (next.templateUrl == 'login.html' || next.templateUrl == 'signup.html') {
                // already going to login
            } else {
                $location.path('/login');
            }
        }
    });

    $rootScope.$on('$routeChangeError', function (event, next, last, error) {
        toastr.error("Unable to load route");
    });

    $rootScope.isLoggedIn = function () {
        return Parse.User.current() != null;
    };

    $rootScope.username = function () {
        if (Parse.User.current()) {
            return Parse.User.current().get('username');
        }
        return null;
    };

    $rootScope.logOut = function () {
        Parse.User.logOut();
        $location.path('/');
    };
});

var LoginController = app.controller('LoginController', function ($rootScope, $scope, $location) {
    $scope.username = '';
    $scope.password = '';

    $scope.logIn = function () {
        $rootScope.loading = true;

        Parse.User.logIn(this.username, this.password, {
            success: function (object) {
                $rootScope.loading = false;
                $location.path('/students');
                $rootScope.$apply();
            },
            error: function (object, error) {
                $rootScope.loading = false;
                $rootScope.$apply();
                toastr.error(error.message ? error.message : "Are you sure your connected to the internet?");
            }
        });
    };

    $scope.signUpRedirect = function () {
        Parse.User.logOut();
        $location.path('/signup');
    };
});

var SignUpController = app.controller('SignUpController', function ($rootScope, $scope, $location) {
    $scope.username = '';
    $scope.password = '';

    $scope.signUp = function () {
        $rootScope.loading = true;

        var user = new Parse.User();
        user.set('username', $scope.username);
        user.set('password', $scope.password);

        user.signUp(null, {
            success: function (object) {
                $rootScope.loading = false;
                $location.path('/students');
                $rootScope.$apply();
            },
            error: function (object, error) {
                $rootScope.loading = false;
                toastr.error(error.message ? error.message : "Are you sure your connected to the internet?");
            }
        });
    };

    $scope.logInRedirect = function () {
        Parse.User.logOut();
        $location.path('/login');
    };
});

var StudentsController = app.controller('StudentsController', function ($rootScope, $scope, $route, $q, $location) {
    $scope.students = [];

    $scope.init = function () {
        $scope.students = $route.current.locals.loadStudents;
    };

    $scope.refresh = function () {
        var promise = StudentsController.loadStudents($rootScope, $q);
        promise.then(function (result) {
            $scope.students = result;
        });
    };

    $scope.newStudent = function () {
        $location.path('/students/new');
    };
});

StudentsController.loadStudents = function ($rootScope, $q) {
    var defer = $q.defer();

    $rootScope.loading = true;

    var query = new Parse.Query(Student);
    query.find({
        success: function (response) {
            var students = [];

            for (var i = 0; i < response.length; i++) {
                var student = response[i]._serverData;
                student.id = response[i].id;
                students.push(student);
            }

            $rootScope.loading = false;
            defer.resolve(students);
            $rootScope.$apply();
        },
        error: function (error) {
            $rootScope.loading = false;
            defer.reject();
            $rootScope.$apply();
            toastr.error(error.message ? error.message : "Are you sure your connected to the internet?");
        }
    });

    return defer.promise;
};


var StudentController = app.controller('StudentController', function ($rootScope, $scope, $route, $q, $location) {

    $scope.init = function () {
        if ($route.current.locals.loadStudent) {
            $scope.fromParseObject($route.current.locals.loadStudent);
        } else {
            $scope.student = { };
            $scope.parseStudent = new Student();
        }

        if ($route.current.locals.loadActions) {
            $scope.fromParseActions($route.current.locals.loadActions);
        } else {
            $scope.actions = [];
        }

        $scope.action = { };
        $scope.action.date = null;
        $scope.action.description = "";
    };

    $scope.fromParseActions = function (parseResult) {
        $scope.actions = [];
        for (var i = 0; i < parseResult.length; i++) {
            var action = {
                id: parseResult[i].id,
                date: parseResult[i].get('date'),
                description: parseResult[i].get('description')
            }
            $scope.actions.push(action);
        }
        $scope.parseActions = parseResult;
    };

    $scope.fromParseObject = function (parseResult) {

        var student = parseResult._serverData;
        student.id = parseResult.id;

        var dateOfBirth = parseResult.get('dateOfBirth');
        if (dateOfBirth) {
            student.dateOfBirth = moment(parseResult.get('dateOfBirth')).format('DD/MM/YYYY');
        } else {
            student.dateOfBirth = null;
        }

        var dateOfEntry = parseResult.get('dateOfEntry');
        if (dateOfEntry) {
            student.dateOfEntry = moment(parseResult.get('dateOfEntry')).format('DD/MM/YYYY');
        } else {
            student.dateOfEntry = null;
        }

        var dateOfLastIEP = parseResult.get('dateOfLastIEP');
        if (dateOfLastIEP) {
            student.dateOfLastIEP = moment(parseResult.get('dateOfLastIEP')).format('DD/MM/YYYY');
        } else {
            student.dateOfLastIEP = null;
        }

        $scope.student = student;
        $scope.parseStudent = parseResult;
    };

    $scope.toParseObject = function () {

        // this student can only be read or written by a single user
        $scope.parseStudent.setACL(new Parse.ACL(Parse.User.current()));

        $scope.parseStudent.set('firstName', $scope.student.firstName);
        $scope.parseStudent.set('lastName', $scope.student.lastName);
        $scope.parseStudent.set('gender', $scope.student.gender);
        $scope.parseStudent.set('yearRoom', $scope.student.yearRoom);
        $scope.parseStudent.set('ethnicity', $scope.student.ethnicity);
        $scope.parseStudent.set('need', $scope.student.need);

        var dateOfBirth = moment($scope.student.dateOfBirth, 'DD/MM/YYYY');
        if (dateOfBirth) {
            $scope.parseStudent.set('dateOfBirth', dateOfBirth.toDate());
        } else {
            $scope.parseStudent.set('dateOfBirth', null);
        }

        var dateOfEntry = moment($scope.student.dateOfEntry, 'DD/MM/YYYY');
        if (dateOfEntry) {
            $scope.parseStudent.set('dateOfEntry', dateOfEntry.toDate());
        } else {
            $scope.parseStudent.set('dateOfEntry', null);
        }

        var dateOfLastIEP = moment($scope.student.dateOfLastIEP, 'DD/MM/YYYY');
        if (dateOfLastIEP) {
            $scope.parseStudent.set('dateOfLastIEP', dateOfLastIEP.toDate());
        } else {
            $scope.parseStudent.set('dateOfLastIEP', null);
        }
    }

    $scope.refresh = function () {
        var promise = StudentController.loadStudent($rootScope, $q, $route);
        promise.then(function (result) {
            $scope.fromParseObject(result);
        });
    };

    $scope.saveStudent = function () {
        $rootScope.loading = true;

        $scope.toParseObject();

        $scope.parseStudent.save(null, {
            success: function (parseResult) {
                toastr.success('Student saved');
                $scope.fromParseObject(parseResult)
                $rootScope.loading = false;
                $location.path('/students');
                $rootScope.$apply();
            },
            error: function (student, error) {
                $rootScope.loading = false;
                $rootScope.$apply();
                toastr.error(error.message ? error.message : "Are you sure your connected to the internet?");
            }
        });
    };

    $scope.saveAction = function () {
        $rootScope.loading = true;

        var date = moment($scope.action.date, 'DD/MM/YYYY');

        var newAction = new Action();
        newAction.setACL(new Parse.ACL(Parse.User.current()));
        newAction.set('student', $scope.parseStudent);
        newAction.set('description', $scope.action.description);

        if (date) {
            newAction.set('date', date.toDate());
        } else {
            newAction.set('date', moment().toDate());
        }

        newAction.save(null, {
            success: function (parseResult) {
                toastr.success('Action saved');

                var promise = StudentController.loadActions($rootScope, $q, $route);
                promise.then(function (result) {
                    $scope.fromParseActions(result);
                });

                $scope.action = {};
                $rootScope.loading = false;
                $rootScope.$apply();
            },
            error: function (student, error) {
                $rootScope.loading = false;
                $rootScope.$apply();
                toastr.error(error.message ? error.message : "Are you sure your connected to the internet?");
            }
        })
    }

    $scope.deleteAction = function (actionId) {
        $rootScope.loading = true;

        var deleteAction = $.grep($scope.parseActions, function (e) {
            return e.id == actionId;
        })[0];

        deleteAction.destroy({
            success: function (parseResult) {
                toastr.success('Action deleted');

                var promise = StudentController.loadActions($rootScope, $q, $route);
                promise.then(function (result) {
                    $scope.fromParseActions(result);
                });

                $rootScope.loading = false;
                $rootScope.$apply();
            },
            error: function (student, error) {
                $rootScope.loading = false;
                $rootScope.$apply();
                toastr.error(error.message ? error.message : "Are you sure your connected to the internet?");
            }
        });
    }
});

StudentController.loadStudent = function ($rootScope, $q, $route) {
    var defer = $q.defer();
    $rootScope.loading = true;

    var query = new Parse.Query(Student);

    query.get($route.current.params.id, {
        success: function (parseResult) {
            $rootScope.loading = false;
            defer.resolve(parseResult);
            $rootScope.$apply();
        },
        error: function (object, error) {
            $rootScope.loading = false;

            defer.reject();
            $rootScope.$apply();

            if (error.message) {
                toastr.error('Unable to load student: ' + error.message);
            }
        }
    });

    return defer.promise;
};

StudentController.loadActions = function ($rootScope, $q, $route) {
    var defer = $q.defer();
    $rootScope.loading = true;

    var query = new Parse.Query(Action);

    // You can also do relational queries by objectId
    var student = new Student();
    student.id = $route.current.params.id;

    query.equalTo('student', student);

    query.ascending("date");

    query.find({
        success: function (parseResult) {
            $rootScope.loading = false;
            defer.resolve(parseResult);
            $rootScope.$apply();
        },
        error: function (object, error) {
            $rootScope.loading = false;

            defer.reject();
            $rootScope.$apply();

            if (error.message) {
                toastr.error('Unable to load actions: ' + error.message);
            }
        }
    });

    return defer.promise;
};

var StudentDeleteModalController = app.controller('StudentDeleteModalController', function ($rootScope, $scope, $location) {

    $scope.modal = {
        title: "Confirm Delete",
        content: "Are you sure you want to delete this student?"
    };

    $scope.confirm = function () {
        $scope.parseStudent.destroy({
            success: function () {
                toastr.warning("Student deleted!");
                $scope.dismiss();
                $location.path('/students');
                $scope.$apply();
            },
            error: function (object, error) {
                if (error.message) {
                    toastr.error(error.message);
                }
                $scope.dismiss();
            }
        });
    };

    $scope.cancel = function () {
        $scope.dismiss();
    };
});