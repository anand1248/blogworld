var app = angular.module('myApp', ['ui.router', 'ngToast', 'textAngular']);

app.run(function($rootScope) {
    Stamplay.User.currentUser()
        .then(function(res) {
                if (res.user) {
                    $rootScope.loggedIn = true;
                    console.log($rootScope.loggedIn);
                } else {
                    $rootScope.loggedIn = false;
                    console.log($rootScope.loggedIn);
                }
            },
            function(err) {
                console.log("Error While logging in!");

            });
});

app.config(function($stateProvider, $locationProvider, $urlRouterProvider) {
    Stamplay.init("onblogs");
    $locationProvider.hashPrefix('');
    $stateProvider
        .state('home', {
            url: '/',
            templateUrl: 'template/home.html',
            controller: 'HomeCtrl'
        })
        .state('signup', {
            url: '/signup',
            templateUrl: 'template/signup.html',
            controller: 'signUpCtrl'
        })
        .state('login', {
            url: '/login',
            templateUrl: 'template/login.html',
            controller: 'loginCtrl'
        })
        .state('MyBlogs', {
            url: '/myBlogs',
            templateUrl: 'template/myBlogs.html',
            controller: 'MyBlogsCtrl'
        })

    .state('create', {
        url: '/create',
        templateUrl: 'template/create.html',
        controller: 'createCtrl'
    })

    .state('edit', {
        url: '/edit/:id',
        templateUrl: 'template/edit.html',
        controller: 'EditCtrl'
    });

    $urlRouterProvider.otherwise("/");
})

app.controller('EditCtrl', function(taOptions, $state, $stateParams, $scope, $timeout, ngToast) {

    $scope.Post = {};
    taOptions.toolbar = [
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
        ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
        ['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
        ['html', 'insertImage', 'insertLink', 'insertVideo', 'wordcount', 'charcount']
    ];

    Stamplay.Object("blogs").get({ _id: $stateParams.id })
        .then(function(res) {
                console.log(res);
                $scope.Post = res.data[0];
                $scope.$apply();
                console.log($scope.Post);
            },
            function(err) {
                console.log(err);
            });

    $scope.update = function() {
        Stamplay.User.currentUser()
            .then(function(res) {
                if (res.user) {
                    if (res.user._id == $scope.Post.owner) {
                        Stamplay.Object("blogs").update($stateParams.id, $scope.Post)
                            .then(function(res) {
                                console.log(res);
                                $state.go("MyBlogs");
                            }, function(error) {
                                console.log(error);
                            });
                    } else
                        $state.go("login");
                } else
                    $state.go("login");
            }, function(err) {
                console.log(err);
            });
    }
});


app.controller('createCtrl', function(taOptions, $state, $scope, $timeout, ngToast) {

    $scope.newPost = {};
    taOptions.toolbar = [
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
        ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
        ['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
        ['html', 'insertImage', 'insertLink', 'insertVideo', 'wordcount', 'charcount']
    ];
    $scope.create = function() {
        Stamplay.User.currentUser()
            .then(function(res) {
                if (res.user) {
                    Stamplay.Object("blogs").save($scope.newPost)
                        .then(function(res) {
                            $timeout(function() {
                                ngToast.create("Created!");
                            });
                            $state.go('MyBlogs')
                        }, function(err) {
                            $timeout(function() {
                                ngToast.create("An error Occured!");
                            });
                        })
                } else {
                    $state.go('login');
                };
            }, function(err) {
                $timeout(function() {
                    ngToast.create("An error Occured!");
                });
                console.log(err);
            })
    }
})


app.controller('MyBlogsCtrl', function($scope, $state) {
    Stamplay.User.currentUser().then(function(res) {
        if (res.user) {
            Stamplay.Object("blogs").get({ owner: res.user._id, sort: "-dt_create" })
                .then(function(response) {
                    console.log(response);
                    $scope.userBlogs = response.data;
                    $scope.$apply();
                    console.log($scope.userBlogs)
                }, function(err) {
                    console.log(err);
                });
        } else {
            $state.go('login');
        }
    }, function(err) {
        console.log(err);
    });
})


app.controller('signUpCtrl', function($scope, $state, ngToast) {

    $scope.signup = function() {

        if ($scope.newUser.firstName && $scope.newUser.lastName && $scope.newUser.email && $scope.newUser.password && $scope.newUser.confirmPassword) {
            console.log("all fields are valid! :");
            if ($scope.newUser.password == $scope.newUser.confirmPassword) {
                console.log("All Good! Let's Sign Up!")
                Stamplay.User.signup($scope.newUser)
                    .then(function(res) {
                        console.log(res)
                        $state.go('login')
                    }, function(err) {
                        // error  
                        console.log(err)
                    })
            } else {
                ngToast.create("Passwords do not match!");
                console.log("passwords do not match!");
            }
        } else {
            console.log("Some Fields are Missing!");
        }
    }
})

app.controller('loginCtrl', function($scope, $state, $timeout, $rootScope) {
    $scope.login = function() {
        Stamplay.User.currentUser()
            .then(function(res) {
                console.log(res);
                if (res.user) {
                    $rootScope.loggedIn = true;
                    $rootScope.displayName = res.user.firstName + " " + res.user.lastName;
                    $timeout(function() { // redirecting 
                        $state.go("MyBlogs");
                    });
                } else {
                    Stamplay.User.login($scope.user)
                        .then(function(res) {
                                console.log("Logged in" + res);
                                $rootScope.loggedIn = true;
                                $rootScope.displayName = res.user.firstName + " " + res.user.lastName;
                                $timeout(function() {
                                    $state.go("MyBlogs");
                                });
                            },
                            function(err) {
                                console.log(err);
                                $rootScope.loggedIn = false;
                            })
                }
            }, function(error) {
                console.log(error);
            });
    }
});

app.controller('MainCtrl', function($scope, $rootScope, $timeout) {
    $scope.logout = function() {
        console.log("Logout Called!")
        Stamplay.User.logout(true, function() {
            console.log("Logged Out!");

            $timeout(function() {
                $rootScope.loggedIn = false;
            })
        });
    }
})

app.controller('HomeCtrl', function($scope, $http) {
    Stamplay.Object("blogs").get({ sort: "-dt_create" })
        .then(function(res) {
            console.log(res);
            $scope.latestBlogs = res.data;
            $scope.apply();
            console.log($scope.latestBlogs);
        }, function(err) {
            console.log(err);
        });
});