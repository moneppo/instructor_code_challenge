/**** Asynchronous Request Utility Functions ****/

// These two functions demonstrate basic asynchronous JSON requests.

function get(url, then) {
	var req = new XMLHttpRequest();
	req.onreadystatechange = function() {
    if (this.readyState === 4) {
			if (this.status === 200) {
      	then(null, JSON.parse(req.responseText));
    	} else {
				then('Error with GET ' + url + ':' + this.readyState);
			}
		}
	};
	req.open('GET', url, true);
	req.send();
}

function post(url, data, then) {
	var req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		 if (this.readyState === 4) {
			 if (this.status === 200) {
      	then(null, JSON.parse(req.responseText));
    	} else {
				then('Error with POST ' + url + ':' + this.readyState);
			}
		}
	};
	req.open('POST', url, true);
	req.setRequestHeader('Content-type', 'application/json');
	req.send(JSON.stringify(data));
}


/**** createMovieListingElement ****/

// This function generates a listing for a movie based on the parsed 
// JSON object 'data' passed into it, and will append it to 'parent'.

function createMovieListingElement(data, parent) {
	var listing = document.createElement('div');
	listing.classList.add('listing');
	
	// Sometimes a movie doesn't have a poster, so we'll show a generic
	// poster
	if (data.Poster === 'N/A') {
		data.Poster = 'images/genericPoster.png';
	}
	
	var poster = document.createElement('img');
	poster.src = data.Poster;
	
	var shortInfo = document.createElement('div');
	shortInfo.classList.add('short-info');
	shortInfo.innerHTML = 
		'<h3>' + data.Title + '</h3>' + 
		'<p>' + data.Year + ', ' + data.Rated + '</p>';
	
	var star = document.createElement('span');
	star.classList.add('icon');
	star.innerHTML = '<i class="fa fa-star"></i>';
	star.addEventListener('click', function(e) {
		star.classList.add('pressed');
		post('favorites', {name: data.Title, oid: data.imdbID}, 
		function(error, result) {
			if (error) {
				console.log(error);
			}
		});
		
		// Because there is an click event bound on the whole listing,
		// when the star is clicked we don't want that event to fire too.
		// This will ensure the click isn't sent to the parent objects of the
		// star.
		e.stopPropagation();
	});
	
	var expandedInfo = document.createElement('div');
	expandedInfo.classList.add('expanded-info');
	expandedInfo.innerHTML =
		'<p>' + data.Genre + '</p>' + 
		'<p>' + data.Director + '</p>' + 
		'<p>' + data.Actors + '</p>' + 
		'<p>' + data.Plot + '</p>';
	
	listing.appendChild(poster);
	listing.appendChild(shortInfo);
	listing.appendChild(star);
	listing.appendChild(expandedInfo);
	
	listing.addEventListener('click', function(e) {
		listing.classList.toggle("expanded");
	});
	
	parent.appendChild(listing);
}


/**** Main ****/

// We wait until the page has fully loaded before adding interactivity.
// This requires that the browser has called onreadystatechange, and that the
// document's state is 'complete'
document.onreadystatechange = function() {
	if (document.readyState === 'complete') {
		
		// First we get references to all the elements we'll add interactivity to
		var form = document.forms['search-form'];
		var search = document.getElementById('search');
		var submit = document.getElementById('search-button');
		var results = document.getElementById('results');
		var favorites = document.getElementById('favorites');
		var star = document.getElementById('star');
		var back = document.getElementById('back');
		var modal = document.getElementById('modal');
		
		// Next we define several functions for handling the various interaction
		// cases.
		
		function keyPressed(event) {
			// When the return key is pressed (keycode 13), we want the search function
		  // to be kicked off, but nothing else.
    	if (event.keyCode === 13) {
      	searchButtonClicked(event);
				event.preventDefault();
    	}
		}
		
		function searchButtonClicked(event) {
			event.preventDefault();
			var requestString = form.action;
			for (var i = 0; i < form.elements.length; i++) {
				if (form.elements[i].type !== 'submit') {
    			requestString += form.elements[i].name + '=' + 
													 form.elements[i].value + '&';
				}
			}
			get(requestString, searchComplete);
		}
		
		function starButtonClicked(event) {		
			get('favorites', populateAndShowFavorites);
		}
		
		function backButtonClicked(event) {
			modal.classList.add('hidden');
		}
		
		function searchComplete(err, movies) {
			if (err) {
				console.log(err);
				return;
			}
				
			results.innerHTML = '';
			movies.Search.forEach(function(movie) {
				get(form.action + 'i=' + movie.imdbID, function(err, movie) {
					if (err) {
						console.log(err);
						return;
					}
					
					if (movie.Error) {
						console.log(movie.Error);
						return;
					}
					
					createMovieListingElement(movie, results);
				});
			});
		}
		
		function populateAndShowFavorites(err, favoriteList) {
			if (err) {
				console.log(err);
				return;
			}
				
			favorites.innerHTML = '';
			
			modal.classList.remove('hidden');
			
			Object.keys(favoriteList).forEach(function(title) {
				get(form.action + 'i=' + favoriteList[title], function(err, movie) {
					if (err) {
						console.log(err);
						return;
					}
					
					if (movie.Error) {
						console.log(movie.Error);
						return;
					}
					
					createMovieListingElement(movie, favorites);
				});
			});
		}
		
	  // And then we add callbacks for clicking items.
		submit.addEventListener('click', searchButtonClicked);
		star.addEventListener('click', starButtonClicked);
		back.addEventListener('click', backButtonClicked);
		search.addEventListener('keydown', keyPressed);
	}
}  