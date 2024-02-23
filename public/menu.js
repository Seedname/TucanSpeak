function signOut() {
    $.ajax({
        type: 'POST',
        url: '/sign-out', 
        contentType: 'application/json',
        success: function(response) {
            window.location.href = response.url;
        },
        error: function(xhr, status, error) {
            window.location.href = "/login";
        }
    });
}


function changeLanguage() {
    $.ajax({
        type: 'POST',
        url: '/change-language', 
        contentType: 'application/json',
        success: function(response) {
            location.reload();
        },
        error: function(xhr, status, error) {
            location.reload();
        }
    });
}