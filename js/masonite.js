/*jshint browser:true, curly:true, white:false, eqeqeq:true, eqnull:true, strict:true, trailing:true, undef:true, regexdash:false */
/*global jQuery, masonite, Modernizr, prettyPrint */

// remap jQuery to $
(function( window, $, undefined ){

	'use strict';

	$.fn.fixYouTube = function() {
		/*
			Widescreen YouTube Embeds by Matthew Buchanan & Hayden Hunter
			http://matthewbuchanan.name/451892574
			http://blog.haydenhunter.me

			Released under a Creative Commons attribution license:
			http://creativecommons.org/licenses/by/3.0/nz/
		*/
		this.find("embed[src^='http://www.youtube.com']").each(function() {
			// Identify and hide embed(s)
			var parent = $(this).closest('object'),
				youtubeCode = parent.html(),
				params = "",
				oldOpts = /rel=0/g,
				newOpts,
				youtubeIDParam = $(this).attr("src"),
				youtubeIDPattern = /\/v\/([0-9A-Za-z-_]*)/,
				youtubeID = youtubeIDParam.match(youtubeIDPattern),
				youtubeHeight = Math.floor(parent.width() * 0.75 + 25 - 3),
				youtubeHeightWide = Math.floor(parent.width() * 0.5625 + 25 - 3);

			parent.css("visibility", "hidden");

			if ( youtubeCode.toLowerCase().indexOf("<param") === -1 ) {
				// IE doesn't return params with html(), so…
				$("param", this).each(function () {
					params += $(this).get(0).outerHTML;
				});
			}

			// Set colours in control bar to match page background
			newOpts = "rel=0&amp;color1=0x" + masonite.whites + "&amp;color2=0x" + masonite.whites;
			youtubeCode = youtubeCode.replace(oldOpts, newOpts);

			if ( params !== "" ) {
				params = params.replace(oldOpts, newOpts);
				youtubeCode = youtubeCode.replace(/<embed/i, params + "<embed");
			}

			// Test for widescreen aspect ratio
			$.getJSON("http://gdata.youtube.com/feeds/api/videos/" + youtubeID[1] + "?v=2&alt=json-in-script&callback=?", function (data) {
				oldOpts = /height="?([0-9]*)"?/g;
				if ( data.entry.media$group.yt$aspectRatio != null ) {
					newOpts = 'height="' + youtubeHeightWide + '"';
				} else {
					newOpts = 'height="' + youtubeHeight + '"';
				}
				youtubeCode = youtubeCode.replace(oldOpts, newOpts);
				if ( params !== "" ) {
					params = params.replace(oldOpts, newOpts);
					youtubeCode = youtubeCode.replace(/<embed/i, params + "<embed");
				}
				// Replace YouTube embed with new code
				parent.html(youtubeCode).css("visibility", "visible");
			});

		});

		return this;
	};

	$.fn.fixSoundcloud = function() {
		this.find("iframe[src^='https://w.soundcloud.com/']").each(function() {
			var $obj = $(this),
				src = $obj.attr("src"),
				attributes = $obj.prop("attributes"),
				$newIframe = $('<iframe></iframe>').insertAfter( $obj ).hide();

			$obj.remove();
			$newIframe.show();

			$.each(attributes, function() {
				if ( this.name === "src" ) {
					$newIframe.attr(this.name, this.value + "&color=" + masonite.accents);
				} else {
					$newIframe.attr(this.name, this.value);
				}
			});
		});

		return this;
	};

	$.fn.fixVimeo = function() {
		/*
			Better Vimeo Embeds 2.1 by Matthew Buchanan
			Modelled on the Vimeo Embedinator Script
			http://mattbu.ch/tumblr/vimeo-embeds/

			Released under a Creative Commons attribution license:
			http://creativecommons.org/licenses/by/3.0/nz/
		*/
		var opts = "title=0&byline=0&portrait=0";

		this.find("iframe[src^='http://player.vimeo.com']").each(function() {
			var src = $(this).attr("src"),
				w = $(this).attr("width"),
				h = $(this).attr("height");

			if ( src.indexOf("?") === -1 ) {
				$(this).replaceWith(
					"<iframe src='" + src + "?" + opts + "&color=" +
					masonite.accents + "' width='" + w + "' height='" + h +
					"' frameborder='0'></iframe>"
				);
			}
		});

		this.find("object[data^='http://vimeo.com']").each(function() {
			var $obj = $(this),
				data = $obj.attr("data"),
				temp = data.split("clip_id=")[1],
				id = temp.split("&")[0],
				server = temp.split("&")[1],
				w = $obj.attr("width"),
				h = $obj.attr("height");

			$obj.replaceWith(
				"<iframe src='http://player.vimeo.com/video/" +
				id + "?" + server + "&" + opts + "&color=" + masonite.accents +
				"' width='" + w + "' height='" + h +
				"' frameborder='0'></iframe>"
			);
		});

		return this;
	};

	$.fn.initColorbox = function() {
		if ( masonite.colorbox ) {
			this.find("a.fullsize").colorbox(masonite.colorboxOptions);
		}

		return this;
	};

	$.fn.disqusCommentCount = function() {
		if ( masonite.disqusShortname ) {
			var scriptURL = 'http://disqus.com/forums/' + masonite.disqusShortname + '/count.js';
			$.getScript(scriptURL);
		}

		return this;
	};

	$.fn.fixTumblrAudio = function() {
		// via http://stackoverflow.com/questions/4218377/tumblr-audio-player-not-loading-with-infinite-scroll
		this.each(function() {
			if ( $(this).hasClass("audio") ) {
				var $audioPost = $(this),
					audioID = $audioPost.attr("id"),
					script = document.createElement('script');
				
				$audioPost.find(".player span").css({ visibility: 'hidden' });

				script.type = 'text/javascript';
				script.src = "http://assets.tumblr.com/javascript/tumblelog.js?16";

				$("body").append(script);

				$.ajax({
					url: "/api/read/json?id=" + audioID,
					dataType: "jsonp",
					timeout: 5000,
					success: function(data){
						$audioPost.find(".player span").css({ visibility: 'visible' });
						var embed = data.posts[0]['audio-player'].replace("audio_player.swf", "audio_player" + masonite.audioPlayerColor + ".swf");
						$audioPost.find("span:first").append('<script type="text/javascript">replaceIfFlash(9,"audio_player_' + audioID + '",\'\x3cdiv class=\x22audio_player\x22\x3e' + embed + '\x3c/div\x3e\')</script>');
					}
				});
			}
		});

		return this;
	};

	function prettifyCode() {
		if ( masonite.googlePrettify ) {
			var a = false;

			$("pre code").parent().each(function() {
				if ( !$(this).hasClass("prettyprint") ){
					$(this).addClass("prettyprint");
						a = true;
					}
			});

			if ( a ) {
				prettyPrint();
			}
		}
	}

	function fadingSidebar() {
		// kudos to http://www.tumblr.com/theme/11862, wouldn't have tought about search
		var $sidebar = $('#header, #copyright'),
			defaultOpacity = 0.5;

		$sidebar.css('opacity', defaultOpacity);

		$sidebar.mouseenter(function() {
			$sidebar
				.stop()
				.animate({
					opacity: 1
				}, 250);
		}).mouseleave(function() {
			if ( $('#header input:focus').length === 0 ) {
				$sidebar
					.stop()
					.animate({
						opacity: defaultOpacity
					}, 250);
			}
		});
	}

	// ready
	$(function() {

		$('#avatar').imagesLoaded(function() {

			var $that = $(this),
				width = $that.width(),
				hidpi = $that.attr('data-hidpi-src'),
				src = $that.attr('src');

			if ( hidpi !== "" ) {

				$that.attr('src', hidpi).attr('width', width);
				$that.one('error', function () {
					this.src = src;
				});

			}

		});

		if ( masonite.fadeSidebar && !Modernizr.touch ) {
			fadingSidebar();
		}

		$('#likes').masonry({
			isAnimated: !Modernizr.csstransitions,
			itemSelector: 'li',
			isResizable: true,
			columnWidth: $('li').width()
		});

		if ( masonite.colorbox ) {

			masonite.colorboxOptions = {
				opacity: 0.92,
				slideshow: true,
				slideshowAuto: false,
				speed: 200,
				photo: true,
				fixed: true,
				maxWidth: "90%",
				maxHeight: "90%"
			};

			$(document).on('cbox_open', function(){
				$('body').css({
					overflow: 'hidden'
				});
			}).on('cbox_cleanup', function(){
				$('body').css({
					overflow: 'auto'
				});
			});

		}

		$('.post')
			.initColorbox()
			.disqusCommentCount()
			.find('embed[src*="assets.tumblr.com\/swf\/audio_player"]')
				.addClass('fit-vids-ignore')
				.end()
			.fixYouTube()
			.fitVids()
			.fixVimeo()
			.fixSoundcloud();

		prettifyCode();

		$('.title').widowFix();

		// index pages
		if ( $('body').hasClass('index') ) {

			var $wall = $('#posts'),
				infinitescroll_behavior;

			if ( masonite.likeLinks ) {
				$('body').append('<iframe id="like"></iframe>');
				$('.footer').on(
					{
						click: function(event) {
							event.preventDefault();
							var $post = $(this).closest('.post'),
								id = $post.attr('id'),
								oauth = $post.attr('rel').slice(-8),
								liked = ( $(this).hasClass('liked') ),
								command = liked ? 'unlike' : 'like',
								iframeSource = 'http://www.tumblr.com/' + command + '/' + oauth + '?id=' + id;

							$('#like').attr('src', iframeSource);
							$(this).toggleClass('liked');
						}
					},
					'.like a'
				);

			}

			if ( !$('body').hasClass('single-column') ) {
				// http://masonry.desandro.com/docs/options.html
				// http://masonry.desandro.com/docs/animating.html#modernizr

				$wall.imagesLoaded(function() {

					$wall.masonry({
						itemSelector: '.post',
						isFitWidth: masonite.centeredContent,
						isResizeBound: !masonite.centeredContent,
						columnWidth: $('.post').outerWidth(true)
					});

					if ( masonite.centeredContent ) {
						var $page = $('#container'),
							offset = $('#header').outerWidth(false),
							$sidebar = $('#header, #copyright'),
							$post = $('.post:first'),
							colW = $post.outerWidth(true),
							postHOff = colW - $post.width(),
							columns = null,
							moreColumns = false;

						$(window).on("debouncedresize", function( event ) {
							// check if columns has changed
							var currentColumns = Math.floor( ( $('body').width() - offset - (postHOff*2) ) / colW );

							if ( currentColumns !== columns && currentColumns > 0 ) {
								// set new column count
								if ( currentColumns > columns ) {
									moreColumns = true;
								} else {
									moreColumns = false;
								}
								columns = currentColumns;
								// apply width to container manually, then trigger relayout
								var $queue;

								if ( moreColumns ) {

									if ( !$('body').hasClass('header-left') ) {
										$queue = $('#header, #copyright, #posts, #container');
									} else {
										$queue = $('#posts, #container');
									}

									$page.animate({
										'width': columns * colW + offset
									}, 100);
									// $wall.width( $wall.width() ).animate({
									//	'width': columns * colW
									// }, 100);

									if ( !$('body').hasClass('header-left') ) {
										$sidebar.animate({
											'margin-left': columns * colW
										}, 100);
									}

									$queue.promise().done(function(){
										$wall.masonry('layout');
										$('#likes').masonry('layout');
									});

								} else {

									$page.width( columns * colW + offset );
									// $wall.width( columns * colW );
									$wall.masonry('layout');
									$('#likes').masonry('layout');
									if ( !$('body').hasClass('header-left') ) {
										$sidebar.css({
											'margin-left': columns * colW
										});
									}
								}
							}
						});
						// trigger resize to set container width
						$(window).trigger( "debouncedresize" );
					}
				});
			}

			if ( masonite.infiniteScroll ) {

				masonite.infiniteScrollLoadingOptions = {
					finishedMsg: "No more pages to load",
					img: "http://static.tumblr.com/wccjej0/SzLlinacm/ajax-loader.gif",
					msgText: "Loading 2/" + masonite.totalPages
				};

				if ( masonite.customTrigger ) {
					infinitescroll_behavior = 'twitter';
					$('#pagination li.next a').text('Load more posts');
				} else {
					masonite.infiniteScrollLoadingOptions.selector = '#copyright';
				}

				$wall.infinitescroll({
					loading: masonite.infiniteScrollLoadingOptions,
					navSelector: '#pagination', // selector for the paged navigation
					nextSelector: '#pagination .next a', // selector for the NEXT link (to page 2)
					itemSelector: '#posts .post', // selector for all items you'll retrieve
					bufferPx: 200,
					behavior: infinitescroll_behavior,
					maxPage: masonite.totalPages,
					errorCallback: function() {
						// fade out the error message after 2 seconds
						$('#infscr-loading').animate({
							opacity: 0.8
						}, 2000).fadeOut('normal');
					}
				},
				function ( newElements ) {
					// get opts by getting internal data of infinite scroll instance
					var opts = $wall.data('infinitescroll').options,
						$elems = $( newElements ).css({ opacity: 0 });

					$elems
						.initColorbox()
						.disqusCommentCount()
						.fixYouTube()
						.fitVids()
						.fixVimeo()
						.fixSoundcloud()
						.fixTumblrAudio()
						.find('.title')
							.widowFix();

					prettifyCode();

					$elems.imagesLoaded(function() {

						if ( !$('body').hasClass('single-column') ) {
							$wall.masonry( 'appended', $elems, true, function() {
								$elems.animate({
									opacity: 1.0
								}, 200, 'swing');
							});

						} else {
							$elems.animate({ opacity: 1.0 }, 200, 'swing');
						}

						if ( masonite.customTrigger ) {
							$('#pagination li.next a').fadeIn({
								duration: 200,
								easing: 'easeInOutCubic'
							});
						}

					});

					setTimeout(function() {
						var $loader = $('#infscr-loading > div');
						if ( (opts.state.currPage + 1) <= masonite.totalPages ) {
							$loader.html("Loading " + (opts.state.currPage + 1) + "/" + masonite.totalPages);
						} else {
							$loader.html("No more pages to load");
						}
					}, 400);
				}
			);
			}

		} // body.index

	}); // ready

})( window, jQuery );