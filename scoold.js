/*
 * Copyright 2013-2022 Erudika. https://erudika.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * For issues and patches go to: https://github.com/erudika
 */
/*global window: false, jQuery: false, $: false, google, hljs, RTL_ENABLED, CONTEXT_PATH, M, CONFIRM_MSG, WELCOME_MESSAGE, WELCOME_MESSAGE_ONLOGIN, MAX_TAGS_PER_POST, MIN_PASS_LENGTH, AVATAR_UPLOADS_ENABLED, IMGUR_CLIENT_ID, IMGUR_ENABLED, CLOUDINARY_ENABLED, MAX_FAVORITE_TAGS, TAG_CREATION_ALLOWED: false */
"use strict";
$(function () {
	var mapCanvas = $("div#map-canvas");
	var locationbox = $("input.locationbox");
	var rusuremsg = CONFIRM_MSG;
	var hostURL = window.location.protocol + "//" + window.location.host;
	var imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif',
		'image/svg+xml', 'image/webp', 'image/bmp', 'image/tiff'];

	// Materialize CSS init

	function initMaterialize() {
		$(".sidenav").sidenav();
		$('textarea').characterCounter();
		$('input.autocomplete').autocomplete();
		$('.collapsible').collapsible();
		$('.tooltipped').tooltip();
		$('.modal', '.modal-trigger').modal();
		$('.chips').chips();
		$('.tabs').tabs();
		$('.dropdown-trigger').dropdown({
			constrainWidth: false,
			coverTrigger: false,
			alignment: RTL_ENABLED ? 'left' : 'right'
		});
		$('select').formSelect();
	}

	initMaterialize();

	/**************************
	 *    Google Maps API
	 **************************/
	if (typeof google !== 'undefined') {
		if (locationbox.length && !mapCanvas.length && google) {
			var searchLocation = new google.maps.places.SearchBox(locationbox.get(0));
			searchLocation.addListener('places_changed', function () {
				var lat = searchLocation.getPlaces()[0].geometry.location.lat();
				var lng = searchLocation.getPlaces()[0].geometry.location.lng();
				if (lat && lng) {
					locationbox.siblings("input[name=latlng]").val(lat + "," + lng);
				}
				if (searchLocation.getPlaces()[0].formatted_address) {
					locationbox.siblings("input[name=address]").val(searchLocation.getPlaces()[0].formatted_address);
				}
			});
			// prevent form submit on enter pressed
			locationbox.keypress(function (event) {
				if (event.keyCode === 10 || event.keyCode === 13) event.preventDefault();
			});
		}

		function initMap(elem) {
			var geocoder = new google.maps.Geocoder(),
				marker = new google.maps.Marker({}),
				locbox = locationbox,
				latlngbox = $("input.latlngbox:first"),
				mapElem = elem || mapCanvas.get(0),
				mapZoom = 5,
				mapMarker = new google.maps.Marker({visible: false});

			var myLatlng = new google.maps.LatLng(47.6975, 9.3241);
			if (latlngbox.length && latlngbox.val().length > 5) {
				var ll = latlngbox.val().split(",");
				myLatlng = new google.maps.LatLng(ll[0], ll[1]);
				mapZoom = 10;
			}
			var map = new google.maps.Map(mapElem, {
						zoom: mapZoom,
						center: myLatlng,
						mapTypeId: google.maps.MapTypeId.ROADMAP,
						mapTypeControl: false,
						streetViewControl: false
				});

			marker.setPosition(myLatlng);
			marker.setMap(map);

			if (locbox.length && $.trim(locbox.val()) !== "") {
				geocoder.geocode({address: locbox.val()}, function(results, status) {
					if (status === google.maps.GeocoderStatus.OK && results.length && results.length > 0) {
						var latlng = results[0].geometry.location;
						mapMarker = new google.maps.Marker({position: latlng, visible: true});
						mapMarker.setMap(map);
						map.setCenter(latlng);
						map.setZoom(mapZoom);
					}
				});
			}

			google.maps.event.addListener(map, 'click', function(event) {
	//			map.setCenter(event.latLng);
				marker.setPosition(event.latLng);
				marker.setMap(map);
				latlngbox.val(event.latLng.lat() + "," + event.latLng.lng());

				geocoder.geocode({location: event.latLng}, function(results, status) {
					if (status !== google.maps.GeocoderStatus.OK) {
						locbox.val("");
					} else {
						if (results.length && results.length > 0) {
							var h = 0,
								country = "",
								locality = "",
								sublocality = "";

							for (h = 0; h < results.length; h++) {
								var arr = results[h].address_components, i;
								for (i = 0; i < arr.length; i++) {
									var type = $.trim(arr[i].types[0]);
									var name = arr[i].long_name;
									if (type === "country") {
										country = name || "";
									}
									if (type === "locality") {
										locality = name || "";
									}
									if (type === "sublocality") {
										sublocality = name || "";
									}
								}
							}
						}
						var found = "";

						if (sublocality !== "" && country !== "") {
							found = sublocality + ", " + country;
						} else if (locality !== "" && country !== "") {
							found = locality +  ", " + country;
						} else {
							found = country;
						}

						locbox.val(found);
					}
				});
			});
		}

		if (mapCanvas.length && mapCanvas.is(":visible")) {
			initMap();
		}
	}

	/****************************************************
     *					MISC FUNCTIONS
     ****************************************************/

	function clearLoading() {
		$(".ajaxwait").hide();
	}

	function startLoading() {
		$(".ajaxwait").removeClass("hide");
	}

	function clearForm(form) {
		$(":input", form).each(function() {
			var type = this.type;
			var tag = this.tagName.toLowerCase(); // normalize case
			if (type === "text" || type === "password" || type === "hidden" ||
				tag === "textarea") {
				this.value = "";
			} else if (type === "checkbox") {
				this.checked = false;
			} else if (tag === "select") {
				this.selectedIndex = 0;
			}
		});
	}

	function crossfadeToggle(elem1, elem2) {
		if ($(elem1).hasClass("hide") || $(elem1).css("display") === "none") {
			$(elem2).trigger("event:hide");
            $(elem2).animate({opacity: "hide"}, 200, function() {
				$(this).addClass("hide");
                $(elem1).animate({opacity: "show"}, 200).removeClass("hide");
				$(elem1).trigger("event:show");
			});
		} else {
			$(elem1).trigger("event:hide");
            $(elem1).animate({opacity: "hide"}, 200, function() {
				$(this).addClass("hide");
                $(elem2).animate({opacity: "show"}, 200).removeClass("hide");
				$(elem2).trigger("event:show");
			});
		}
	}

	function submitForm(form, method, callbackfn, errorfn) {
		if (method === "GET" || method === "POST") {
			var $form = $(form);
			if ($form.data('submittedAjax') !== true) {
				$form.data('submittedAjax', true);
				$.ajax({
					type: method,
					url: form.action,
					data: $form.serialize(),
					success: function(data, status, xhr) {
						clearLoading();
						setTimeout(function () {
							$form.data('submittedAjax', false);
						}, 5000);
						callbackfn(data, status, xhr, form);
					},
					error: function (xhr, statusText, error) {
						clearLoading();
						$form.data('submittedAjax', false);
						var cb = errorfn || $.noop;
						cb(xhr, statusText, error, form);
					}
				});
			}
		}
	}

	function submitFormBind(formname, callbackfn, errorfn) {
		return $(document).on("submit", formname,  function() {
			submitForm(this, "POST", callbackfn, errorfn);
			return false;
		});
	}

	function areYouSure(func, msg, returns) {
		if (confirm(msg)) {
			func();
			if (returns) {
				return true;
			}
		}
		return false;
	}

	/****************************************************
     *					GLOBAL BINDINGS
     ****************************************************/

	$(document).on("click", ".rusure",  function() {
		return areYouSure($.noop, rusuremsg, true);
	});

	$(document).on("submit", "form",  function(e) {
		var $form = $(this);
		if ($form.data('submitted') === true) {
			e.preventDefault();
		} else {
			$form.data('submitted', true);
		}
	});

	$(document).on("click", "a.next-div-toggle",  function(e) {
		var that = $(this);
		var hdiv = that.nextAll("div:first");
		if (!hdiv.length) {
			hdiv = that.parent().nextAll("div:first");
		}
		if (!hdiv.length) {
			hdiv = that.closest("div").find("div:first");
		}
		hdiv.toggleClass("hide").find("input[type=text]:first, textarea:first").focus();
		return false;
	});

	$(document).on("click", "a.next-span-toggle",  function() {
		$(this).nextAll("span:first").toggleClass("hide");
		return false;
	});

	$(document).on("click", ".editlink",  function() {
		var that = $(this);
		var parent = that.closest(".row");
		var viewbox = parent.find(".viewbox:first");
		var editbox = parent.find(".editbox:first");
		if (!viewbox.length) {
			viewbox = that.nextAll(".viewbox:first");
		}
		if (!viewbox.length) {
			viewbox = that.closest(".viewbox");
		}
		if (!viewbox.length) {
			viewbox = parent.closest(".row").nextAll(".viewbox:first");
		}
		if (!viewbox.length) {
			viewbox = parent.closest(".postbox").find(".viewbox:first");
		}
		if (!editbox.length) {
			editbox = that.nextAll(".editbox:first");
		}
		if (!editbox.length) {
			editbox = viewbox.nextAll(".editbox:first");
		}
		crossfadeToggle(viewbox.get(0), editbox.get(0));
		return false;
	});

	$(document).on("click", ".canceledit",  function() {
		var editbox = $(this).closest(".editbox").get(0);
		var viewbox = $(editbox).siblings(".viewbox").get(0);
		crossfadeToggle(viewbox, editbox);
		return false;
	});

	$(document).on("click", "a.votelink",  function() {
		var dis = $(this);
		var up = dis.hasClass("upvote");
		var votes = dis.closest("div.votebox").find(".votecount").filter(':visible');
		if (!dis.data("disabled")) {
			var selectedVote = dis.closest(".votebox").find(".cast").removeClass("cast");
			if (!selectedVote.length) {
				dis.find(".downvote,.upvote").addClass("cast");
			}
			dis.data("disabled", true);
			$.post(this.href, function(data) {
				if (data === true) {
					var newvotes = parseInt(votes.text(), 10) || 0;
					if (up) {
						votes.text(++newvotes).removeClass("hide");
					} else {
						votes.text(--newvotes).removeClass("hide");
					}
				}
				dis.removeData("disabled");
			}, "json");
		}
		return false;
	});

	$("body").ajaxSuccess(function() {
		clearLoading();
	});

	$(document).on("click", ".post-refresh-ask",  function() {
		var elem = $(this);
		areYouSure(function() {
			$.post(elem.attr("href"), function(data) {
				window.location.reload(true);
			});
		}, rusuremsg, false);
		return false;
	});

	$(document).on("click", ".post-refresh",  function() {
		$.post($(this).attr("href"), function() {
			window.location.reload(true);
		});
		return false;
	});

	$(document).on("click", ".permalink",  function() {
		navigator.clipboard.writeText(this.href);
		var that = $(this).find("i");
		var attr = that.attr("class");
		that.text("Copied!").attr("class", "green-text smallText");
		setTimeout(function () {
			that.text("").attr("class", attr);
		}, 2000);
		return false;
	});

	$(document).on("click", ".click2hide",  function() {
		$(this).hide();
		return false;
	});

	$(document).on("click", ".toggle-drawer",  function() {
		$('#search-drawer').toggleClass('hide');
		$('#search-info-drawer').addClass('hide');
		$('#search-box').focus();
		return false;
	});

	$(document).on("click", "#search-info-left,#search-info-right", function() {
		$('#search-info-drawer').toggleClass('hide');
		return false;
	});

	$(document).on("click", ".close-infostrip", function () {
		var name = $(this).closest(".infostrip,.infostrip2").hide().data("name");
		localStorage.setItem(name + "-hidden", "true");
		return false;
	});

	if (WELCOME_MESSAGE && WELCOME_MESSAGE.trim().length > 0) {
		var hidden = "true" === localStorage.getItem("welcome-message-hidden");
		if (!hidden && window.location.pathname.indexOf(CONTEXT_PATH + "/signin") < 0) {
			$(".infostrip").removeClass("hide").data("name", "welcome-message");
			$(".infostrip-content").html(WELCOME_MESSAGE);
		}
	}

	if (WELCOME_MESSAGE_ONLOGIN && WELCOME_MESSAGE_ONLOGIN.trim().length > 0) {
		var hidden = "true" === localStorage.getItem("welcome-message-onlogin-hidden");
		if (!hidden && window.location.pathname.indexOf(CONTEXT_PATH + "/signin") < 0) {
			$(".infostrip").removeClass("hide").data("name", "welcome-message-onlogin");
			$(".infostrip-content").html(WELCOME_MESSAGE_ONLOGIN);
		}
	}

	if (WELCOME_MESSAGE_PRELOGIN && WELCOME_MESSAGE_PRELOGIN.trim().length > 0) {
		var hidden = "true" === localStorage.getItem("welcome-message-prelogin-hidden");
		if (!hidden) {
			$(".infostrip2").removeClass("hide").data("name", "welcome-message-prelogin");
			$(".infostrip2-content").html(WELCOME_MESSAGE_PRELOGIN);
		}
	}

	/****************************************************
     *                    ADMIN
     ****************************************************/

    submitFormBind("form#create-space-form", function (data, status, xhr, form) {
		clearForm(form);
		$('.spaces-wrapper div:eq(0)').after(data);
		$('#name_text').removeClass("invalid");
	}, function () {
		$('#name_text').addClass("invalid");
	});

	$(document).on("click", "a.delete-space", function () {
		var elem = $(this);
		return areYouSure(function () {
			elem.closest(".spacebox").fadeOut("fast", function () { elem.remove(); });
			$.post(elem.attr("href"));
		}, rusuremsg, false);
	});

	submitFormBind("form.space-rename-form", function (data, status, xhr, form) {
		var $form = $(form);
		var space = $form.find("input[name=newspace]").val();
		$form.closest(".card-panel").find(".editlink").click();
		$form.closest(".card-panel").find(".space-name-box").text(space);
	});

	$(document).on("click", "a.toggle-webhook", function () {
		var elem = $(this);
		elem.toggleClass("hide").siblings("a.toggle-webhook").toggleClass("hide");
		$.post(elem.attr("href"));
		return false;
	});

	$(document).on("click", "a.delete-webhook", function () {
		var elem = $(this);
		return areYouSure(function () {
			elem.closest(".webhookbox").fadeOut("fast", function () { elem.remove(); });
			$.post(elem.attr("href"));
		}, rusuremsg, false);
	});

	var importForm = $("#import-form");
	importForm.find("input[type=text]").change(function () {
		if ($(this).val().trim() === "") {
			importForm.find(".import-text").next("strong").addClass("hide").end().removeClass("hide");
		} else {
			importForm.find(".import-text").next("strong").removeClass("hide").end().addClass("hide");
		}
	});

	$("#select-theme-form").on("click", "input", function() {
		if (this.value === "custom") {
			$(this).closest("form").find("textarea").parent("div").removeClass("hide");
		} else {
			$(this).closest("form").find("textarea").parent("div").addClass("hide");
		}
	});

	$(document).on("click", "input.api-key", function () {
		$(this).focus();
		$(this).select();
		document.execCommand("copy");
		$(this).next("span").text("Copied!").show().fadeOut(3000);
	});

	submitFormBind("#api-key-form", function (data, status, xhr, form) {
		var table = $(form).find(".api-key-table");
		var row = table.find(".api-key-row:first").clone().removeClass("hide");
		row.find("input.api-key").val(data.jwt);
		row.find(".api-key-expires").text(data.exp || "never");
		row.find("a").attr("href", function (i, href) {
			return href + data.jti;
		});
		table.append(row).removeClass("hide");
		row.find(".api-key-show").click();
	});

	$(document).on("click", ".api-key-revoke", function () {
		var elem = $(this);
		return areYouSure(function () {
			elem.closest(".api-key-row").fadeOut("fast", function () {
				elem.remove();
			});
			$.post(elem.attr("href"));
		}, rusuremsg, false);
	});

	$(".adminpage .tab").on("click", function () {
		history.pushState("", document.title, window.location.pathname + window.location.search);
	});

	$(".configuration-form .filled-in").on("click", function () {
		var next = $(this).next("span");
		if (next.text() === next.attr("data-on")) {
			next.text(next.attr("data-off"));
		} else {
			next.text(next.attr("data-on"));
		}
	});

	submitFormBind("form.configuration-form", function (data, status, xhr, form) {
		var btn = $(form).find("button[type='submit']");
		var txt = btn.html();
		btn.html("<span class='green-text'>&#x2714;" + txt + "</span>").addClass("disabled");
		setTimeout(function () {
			btn.removeClass("disabled").html(txt);
		}, 3000);
	});

	/****************************************************
     *                    REPORTS
     ****************************************************/

	$(document).on("click", "a.delete-report", function() {
		var dis = $(this);
		$.post(dis.attr("href"));
		dis.closest(".reportbox").fadeOut("fast", function() {dis.remove();});
		return false;
	});

	submitFormBind("form.create-report-form", function(data, status, xhr, form) {
		$("#main-modal").modal("close");
		clearForm(form);
	});

	function closeReport(parent, click) {
		parent.addClass("closed-report z-depth-0");
		parent.find(".report-closed-icon").removeClass("hide");
		if (click) {
			parent.find(".report-close-btn").click();
		}
		parent.find(".report-close-btn,.approve-btn").addClass("hide");
		parent.find(".report-open-btn").removeClass("hide");
	}

	submitFormBind("form.close-report-form", function(data, status, xhr, form) {
		closeReport($(form).closest(".reportbox"), true);
	});

	$(".approve-btn").on("click", function(e) {
		$.post($(this).attr("href"));
		closeReport($(this).closest(".reportbox"), false);
		return false;
	});

	$(".report-open-btn").on("click", function(e) {
		$.post($(this).attr("href"));
		var parent = $(this).closest(".reportbox");
		parent.removeClass("closed-report z-depth-0");
		parent.find(".report-closed-icon").addClass("hide");
		parent.find(".report-close-btn,.approve-btn").removeClass("hide");
		parent.find(".report-open-btn").addClass("hide");
		return false;
	});

	/****************************************************
     *                    PROFILE
     ****************************************************/

	var profileAvatar = $("img.profile-pic.on-profile-page");
	var navbarAvatar = $("img.profile-pic:first");
	var avatarUrlInput = $("#picture-url");
	var avatarEditForm = avatarUrlInput.closest("form");
	var defaultAvatar = $("#avatar-default-url").val();

	function changeAvatars(newPicValue) {
		avatarUrlInput.val(newPicValue);
		if (navbarAvatar.attr("src") === profileAvatar.attr("src")) {
			navbarAvatar.attr("src", newPicValue);
		}
		profileAvatar.attr("src", newPicValue);
	}

	function changeAvatarAndSubmit(newValue) {
		setTimeout(function () {
			changeAvatars(newValue);
			$.post(avatarEditForm.attr("action"), {picture: newValue});
		}, 200);
	}

	$("#use-gravatar-switch").change(function () {
		var rthis = $(this);
		if(rthis.prop('checked')) {
			changeAvatarAndSubmit($("#avatar-gravatar-url").val());
		} else {
			changeAvatarAndSubmit($("#avatar-custom-url").val() || defaultAvatar);
		}
	});

	$("#clear-avatar-btn").click(function () {
		changeAvatarAndSubmit(defaultAvatar);
		avatarEditForm.find(".canceledit").click();
		return false;
	});

	$("img.profile-pic, #edit-picture-link").on("mouseenter", function () {
		$("#edit-picture-link").show();
	});
	$("img.profile-pic").on("mouseleave", function () {
		$("#edit-picture-link").hide();
	});

	$("a.make-mod-btn").on('click', function () {
		var dis = $(this);
		$.post(dis.attr("href"));
		dis.find("span").toggleClass("hide");
		var modCount = $(".smallspacebox.orange-border").length;
		dis.closest(".smallspacebox").toggleClass("orange-border");
		if ((modCount === 0 && $(".smallspacebox.orange-border").length === 0) ||
				(modCount === 0 && $(".smallspacebox.orange-border").length === 1) ||
				(modCount === 1 && $(".smallspacebox.orange-border").length === 0)) {
			$(".moderator-icon").toggleClass("hide");
			$(".moderator-icon").parent("div").toggleClass("hide");
		}
		return false;
	});

	if (AVATAR_UPLOADS_ENABLED) {
		var jsonFieldName = CLOUDINARY_ENABLED ? "secure_url" : "link";
		var enableAvatarUploadLoading = function () {
			$("#change-avatar-btn").attr("disabled", "disabled");
			$("#avatar_loading").removeClass("hide");
		};
		var disableAvatarUploadLoading = function () {
			$("#change-avatar-btn").removeAttr("disabled");
			$("#avatar_loading").addClass("hide");
		};

		var beforeSendFile = function(file, next) { return next(file); };
		var uploadOpts = {
			remoteFilename: function (file) {
				return (profileAvatar.attr("id") || "profile_" + Date.now()) + "_" + file.name;
			},
			onFileUploadResponse: function (xhr) {
				var result = JSON.parse(xhr.responseText);
				changeAvatarAndSubmit(result && result.data ? result.data[jsonFieldName] : result[jsonFieldName]);
				disableAvatarUploadLoading();
			},
			onFileUploadError: function () {
				disableAvatarUploadLoading();
			},
			allowedTypes: imageTypes
		};
		if (IMGUR_ENABLED) {
			uploadOpts.uploadUrl = "https://api.imgur.com/3/image";
			uploadOpts.uploadMethod = "POST";
			uploadOpts.jsonFieldName = jsonFieldName;
			uploadOpts.uploadFieldName = "image";
			uploadOpts.extraHeaders = {
				"Authorization": "Client-ID " + IMGUR_CLIENT_ID
			};
		} else if (CLOUDINARY_ENABLED) {
			beforeSendFile = function (file, onSuccess, onError) {
				$.ajax({
					type: "POST",
					async: false,
					url: avatarEditForm.attr("action") + '/cloudinary-upload-link',
					success: function (signedRequest) {
						dropPicHandler.settings.uploadUrl = signedRequest.url;
						dropPicHandler.settings.extraParams = signedRequest.data;
						dropPicHandler.settings.jsonFieldName = jsonFieldName;
						onSuccess(file);
					},
					error: onError
				});
			};
		}

		var dropPicHandler = new inlineAttachment(uploadOpts);

		dropPicHandler.editor = {
			insertValue: $.noop,
			getValue: function () { return ""; },
			setValue: $.noop
		};

		profileAvatar.on({
			dragleave: function () {
				$(this).removeClass('droptarget');
			},
			dragover: function (e) {
				$(this).addClass('droptarget');
				e.preventDefault();
			},
			drop: function (e) {
				$(this).removeClass('droptarget');
				e.preventDefault();
				dropPicHandler.onDrop(e.originalEvent);
			}
		});

		$("#change-avatar-btn").on('click', function () {
			$(this).next("[type=file]").click();
			return false;
		});

		$('input[type=file]').on('change', function (e) {
			var file = e.target.files.length ? e.target.files[0] : null;
			if (!file) return;

			enableAvatarUploadLoading();

			beforeSendFile(file, function(file) {
				dropPicHandler.onFileInserted(file);
				dropPicHandler.uploadFile(file);
				avatarEditForm.find(".canceledit").click();
			}, function(error) {
				console.error(error);
				disableAvatarUploadLoading();
			});
		});
	}

	var badgePreview = $("#badge-preview");
	var badgeName = $("#badge-preview-tag");
	var badgeIcon = $("#badge-preview-icon");

	$("#badge-tag").on("keyup", function () {
		badgeName.text($(this).val());
	});
	$("#badge-description").on("keyup", function () {
		badgePreview.attr("title", $(this).val());
	});
	$("#badge-icon").on("change", function () {
		badgeIcon.removeClass("hide").text($(this).val());
	});
	$("#badge-color").on("change", function () {
		badgeName.css("color", $(this).val());
	});
	$("#badge-background").on("change", function () {
		badgePreview.css("background-color", $(this).val());
	});

	$(document).on("mouseenter", ".custom-badge", function () {
		var dis = $(this);
		if (dis.hasClass("add")) {
			dis.find(".fa-plus").removeClass("hide");
		} else if ($(this).hasClass("remove")) {
			dis.find(".fa-minus").removeClass("hide");
		}
	});
	$(document).on("mouseleave", ".custom-badge", function () {
		var dis = $(this);
		if (dis.hasClass("add")) {
			dis.find(".fa-plus").addClass("hide");
		} else if ($(this).hasClass("remove")) {
			dis.find(".fa-minus").addClass("hide");
		}
	});

	$(document).on("click", ".custom-badge.add", function () {
		$.post($(this).hide().children("i").addClass("hide").end().
				removeClass("add").addClass("remove").show().appendTo("#user-badges").attr("data-url"));
	});

	$(document).on("click", ".custom-badge.remove", function () {
		$.post($(this).hide().children("i").addClass("hide").end().
				removeClass("remove").addClass("add").show().appendTo("#available-badges").attr("data-url"));
	});

	/****************************************************
     *                      SETTINGS
     ****************************************************/

	$("#newpostEmailsSwitch").on("click", function () {
		if ($(this).is(":checked")) {
			$("#newpostEmailsFilterToggle").removeClass("hide");
		} else {
			$("#newpostEmailsFilterToggle").addClass("hide");
			$("#newpostEmailsFilter").addClass("hide");
		}
	});

	$("#newpostEmailsFilterToggle").on("click", function () {
		$("#newpostEmailsFilter").toggleClass("hide");
		return false;
	});

	$("#newpostEmailsFilter select").on("change", function () {
		var selected = $(this).find("option:not([disabled])").filter(":selected").length;
		if (selected > 0) {
			$(this).find("option[disabled]").removeAttr("selected");
		} else {
			$(this).find("option[disabled]").attr("selected");
		}
	});

	$("#twofaSwitch").on("click", function () {
		var div = $("#twofaSetup");
		if (div.hasClass("hide")) {
			div.removeClass("hide");
		} else {
			div.addClass("hide");
		}
	});

	/****************************************************
     *                    MODAL DIALOGS
     ****************************************************/

	 $('#main-modal').modal({
		onOpenStart: function (modal, trigger) {
			var div = $(modal);
			var trigr = $(trigger);
			if (typeof trigr.data("loadedForm") === "undefined") {
				$.get(trigr.attr("data-fetch"), function(data) {
					clearLoading();
					div.html(data);
					trigr.data("loadedForm", data);
					div.find('select').formSelect();
					$('textarea').characterCounter();
				});
			} else {
				div.html(trigr.data("loadedForm"));
				div.find('select').formSelect();
				$('textarea').characterCounter();
			}
			div.on("click", ".modal-close", function() {
				$("#main-modal").modal("close");
				return false;
			});
		}
	});


	/****************************************************
     *                    COMMENTS
     ****************************************************/

	var commentInput = $("input[name='comment']", "form.new-comment-form");
	setTimeout(function () { $("input.charcounter").characterCounter(); }, 200);
	submitFormBind("form.new-comment-form", function(data, status, xhr, form) {
		var textbox = commentInput;
		var that = $(form);
		var commentsbox = that.closest("div.postbox").find("div.comments");
		var pageContentDiv = commentsbox.find(".page-content");
		if (pageContentDiv.length) {
			pageContentDiv.append(replaceMentionsWithHtmlLinks(data));
		} else {
			commentsbox.append(replaceMentionsWithHtmlLinks(data));
		}
		that.closest("div.newcommentform").addClass("hide");
		textbox.val("");
	});

	$(document).on("click", "a.delete-comment",  function() {
		var that = $(this);
		return areYouSure(function() {
			that.closest("div.commentbox").fadeOut("fast", function() {that.remove();});
			$.post(that.attr("href"));
		}, rusuremsg, false);
	});

	$(document).on("click", "a.show-comment",  function() {
		$(this).siblings("div:hidden").show().end().prev("span").addBack().remove();
		return false;
	});

	/****************************************************
     *                      TAGS
     ****************************************************/

	submitFormBind("form.tag-rename-form", function(data, status, xhr, form) {
		var $form = $(form);
		var hiddenTag = $form.find("input[type=hidden]");
		var tag = $form.find("input[name=newtag]").val();
		var description = $form.find("input[name=description]").val();
		hiddenTag.val(tag);
		$form.closest(".col").find(".tag-count").html("&times; " + (data.count || 0)).end().
				find(".next-div-toggle").click().prevAll("a").text(data.tag || tag).attr("href", function (i, href) {
					return href.substring(0, href.lastIndexOf('/') + 1) + encodeURIComponent(data.tag);
				});
		$form.closest(".card-panel").find(".editlink").click();
		$form.closest(".card-panel").find(".tag-description-box").text(description);
	});

	$(document).on("click", "a.delete-tag",  function() {
		var that = $(this);
		that.closest("div.tagbox").fadeOut("fast", function() {that.remove();});
		$.post(that.attr("href"));
		return false;
	});

	var tagDescriptions = {};
	$(".tagchip").on("mouseenter", function () {
		var that = $(this);
		var tag = that.text();
		if (tag && $.trim(tag) !== "") {
			if (!tagDescriptions[tag] || tagDescriptions[tag] === "") {
				$.get(CONTEXT_PATH + "/tags/" + tag, function (data) {
					data.map(function (t) {
						if (t.description) {
							tagDescriptions[t.tag] = t.description;
							showTagTooltip(that, tagDescriptions[tag]);
						}
					});
				});
			}
			if ($.trim(tagDescriptions[tag]) !== "" && that.attr("data-tooltip") !== tagDescriptions[tag]) {
				showTagTooltip(that, tagDescriptions[tag]);
			}
		}
	});

	function showTagTooltip(that, text) {
		if (text && $.trim(text) !== "") {
			that.attr("title", "");
			that.next("div.material-tooltip").css({
				"opacity":"1",
				"visibility":"visible",
				"left": that.offset().left,
				"top": that.offset().top + 40
			}).find(".tooltip-content").text(text);
		}
	}

	$(".tagchip").on("mouseleave", function () {
		var that = $(this);
		setTimeout(function () {
			that.next("div.material-tooltip").css({"opacity": "0", "visibility": "hidden"});
		}, 150);
	});

	/****************************************************
     *                  PAGINATION
     ****************************************************/

	$(document).on("click", "a.more-link",  function() {
		var that = $(this),
			macroCode = that.siblings(".page-macro-code").text(),
			contentDiv = that.parent("div").prev("div"),
			href = that.attr("href"),
			cleanHref = href.substring(0, href.lastIndexOf("=") + 1);

		that.addClass("loading");
		$.get(this.href, {pageMacroCode: macroCode}, function(data) {
			clearLoading();
			var trimmed = $.trim(data);
			if (trimmed !== "") {
				var spanBlock = trimmed.substring(trimmed.lastIndexOf("<span")),
					nextPageSpan = $(spanBlock),
					nextPage = parseInt(nextPageSpan.attr("class"), 10),
					parsedData = $(trimmed);

				if (nextPageSpan && !isNaN(nextPage)) {
					that.attr("href", cleanHref + nextPage);
					nextPageSpan.remove();
					if (parsedData.length === 1) {
						that.hide();
					} else {
						contentDiv.append(trimmed).find(".dropdown-trigger").dropdown();
					}
					$(document).trigger("event:page");
				}
			}
		});

		return false;
	});

	/****************************************************
     *                     QUESTIONS
     ****************************************************/

	if (window.location.hash !== "" && window.location.hash.match(/^#post-.*/)) {
		try {
			$(window.location.hash).addClass("selected-post");
		} catch (e) {
			console.error(e);
		}
	}

	$(document).on('click', '.page-content .questionbox',  function () {
		if (window.matchMedia("only screen and (max-width: 900px)").matches) {
			return $(this).find("a:first").get(0).click();
		}
	});

	function replaceMentionsWithMarkdownLinks(text) {
		return text.replace(/@<(.+?)\|(.*?)>/igm, function (m, group1, group2) {
			return "[" + (group2 || "NoName") + "](" + hostURL + "/profile/" + group1 + ")";
		});
	}

	function replaceMentionsWithHtmlLinks(text) {
		return text.replace(/@(&lt;|<)(.+?)\|(.*?)(&gt;|>)/igm, function (m, group1, group2, group3) {
			return "<a href=\"" + hostURL + "/profile/" + encodeURIComponent(group2) + "\">" +
					(new Option(group3 || "NoName").innerHTML) + "</a>";
		});
	}

	function updateMentionsWithLinks() {
		var postboxes = $(".postbox .postbody, .commentbox .comment-text");
		postboxes.html(function (i, html) {
			return replaceMentionsWithHtmlLinks(html);
		});
		$(".questionbox .question-header").html(function (i, html) {
			// also fix truncated links in post body where elipsis function is used
			return replaceMentionsWithHtmlLinks(html).replace(/@(&lt;|<)*?.*?\.\.\./igm, "");
		});
	}

	updateMentionsWithLinks();

	$(document).on("event:page", function() {
		initMaterialize();
		updateMentionsWithLinks();
	});

	$(".emoji-picker-container").on("emoji:select", function(e, data) {
		var textbox = $(this).find("textarea");
		if (textbox.data("codemirror")) {
			var cm = textbox.data("codemirror");
			cm.setValue(cm.getValue() + data.emoji);
		} else {
			var target = $(this).find(".emoji-picker-target");
			target.text((target.hasClass("single") ? "" : target.text()) + data.emoji);
			target.val((target.hasClass("single") ? "" : target.val()) + data.emoji);
			target.trigger("change");
		}
	});

	function initPostEditor(elem) {
		var mde = new EasyMDE({
			element: elem,
			autoDownloadFontAwesome: false,
			sideBySideFullscreen: false,
			showIcons: ["code", "table", "strikethrough"],
			spellChecker: false,
			promptURLs: true,
			toolbar: ["bold", "italic", "strikethrough", "heading", "|",
				"code", "quote", "unordered-list", "ordered-list", "|", "link", "image", "table", {
				name: "attach-emoji",
				className: "fa fa-smile-o emoji-button empty",
				title: "Insert emoji"
			},  "|", "preview", "side-by-side", "fullscreen", "|", "guide"],
			previewRender: function (plainText) {
				return this.parent.markdown(replaceMentionsWithMarkdownLinks(plainText));
			},
			status: [{
				className: "saved",
				defaultValue: function(el) {
					el.innerHTML = "";
					$(document).on("event:post-edit-saved", function () {
						el.innerHTML = "<b class='green-text'>saved</b>";
						$(el).show().delay(2000).fadeOut();
					});
				},
				onUpdate: function(el) {
					el.innerHTML = "";
				}
			}, "lines", "words", "cursor"]
		});
		if (RTL_ENABLED) {
			mde.codemirror.options.direction = "rtl";
			//mde.codemirror.options.rtlMoveVisually = false;
		}

		$(elem).data("codemirror", mde.codemirror);
		return mde;
	}

	// save draft in localstorage
	var askForm = $("form#ask-question-form, form#write-feedback-form");
	if (askForm.length) {
		var title = askForm.find("input[name=title]");
		var tags = askForm.find("input[name=tags]");
		var body = initPostEditor(askForm.find("textarea[name=body]").get(0));

		try {
			if (!title.val()) title.val(localStorage.getItem("ask-form-title") || "");
			if (!body.value()) body.value(localStorage.getItem("ask-form-body") || "");
			if (!tags.val()) tags.val(localStorage.getItem("ask-form-tags") || "");
			M.updateTextFields();

			var saveDraftInterval1 = setInterval(function () {
				var saved = false;
				if (localStorage.getItem("ask-form-title") !== title.val()) {
					localStorage.setItem("ask-form-title", title.val());
					saved = true;
				}
				if (localStorage.getItem("ask-form-body") !== body.value()) {
					localStorage.setItem("ask-form-body", body.value());
					saved = true;
				}
				if (localStorage.getItem("ask-form-tags") !== tags.val()) {
					localStorage.setItem("ask-form-tags", tags.val());
					saved = true;
				}
				if (saved) {
					$(document).trigger("event:post-edit-saved");
				}
			}, 3000);

			var titleTimeout = null;
			var similarContainer = title.next(".similar-posts");
			var similarTitle = similarContainer.find(".similar-posts-title").first().remove();
			title.on("input", function () {
				if (titleTimeout) {
					clearTimeout(titleTimeout);
				}
				if (title.val() && title.val().trim().length > 0) {
					titleTimeout = setTimeout(function () {
						var liketxt = title.val().replaceAll(/[^\p{Alpha}]/gmu, " ").replaceAll(/\s+/gmi, " ").trim() || "*";
						$.get(CONTEXT_PATH + "/questions/similar/" + liketxt, function (data) {
							if (data && data.trim().length > 0) {
								similarContainer.html(data).prepend(similarTitle);
							} else {
								similarContainer.html("");
							}
						});
					}, 1000);
				} else {
					similarContainer.html("");
				}
			});

			submitFormBind("#ask-question-form", function (data, status, xhr, form) {
				clearInterval(saveDraftInterval1);
				localStorage.removeItem("ask-form-title");
				localStorage.removeItem("ask-form-body");
				localStorage.removeItem("ask-form-tags");
				window.location.href = data.url || "";
			}, function (xhr, status, error) {
				clearInterval(saveDraftInterval1);
				$(document).off("submit"); // turn off this handler and prevent infinite redirect loop
				askForm.submit(); // retry normal POST submit (non-AJAX) to see validation errors
			});
		} catch (exception) {}
	}

	$(".show-answer-question-form").click(function () {
		$(this).closest("div").next("div").removeClass("hide").end().hide();
	});

	if (window.location.pathname.match("/write$")) {
		$("html, body").animate({
			scrollTop: $("#answer-question-form").first().offset().top
		});
	}

	var answerForm = $("form#answer-question-form");
	if (answerForm.length) {
		var answerBody = initPostEditor(answerForm.find("textarea[name=body]").get(0));
		try {
			if (!answerBody.value()) answerBody.value(localStorage.getItem("answer-form-body") || "");
			var saveDraftInterval2 = setInterval(function () {
				if (localStorage.getItem("answer-form-body") !== answerBody.value()) {
					localStorage.setItem("answer-form-body", answerBody.value());
					$(document).trigger("event:post-edit-saved");
				}
			}, 3000);

			submitFormBind("#answer-question-form", function (data, status, xhr, form) {
				clearInterval(saveDraftInterval2);
				var allPosts = answerForm.closest(".row").find(".postbox");
				if (allPosts.length > 1) {
					allPosts.last().after(data);
					updateMentionsWithLinks();
				} else {
					$(".answers-head").removeClass("hide").after(data);
				}
				answerForm.hide();
				answerBody.value("");
				localStorage.removeItem("answer-form-body");
			}, function (xhr, status, error) {
				clearInterval(saveDraftInterval2);
				window.location.reload(true);
			});
		} catch (exception) {}
	}

	var saveTimeout;
	var saveTextToLocalStorage = function(id, val) {
		clearTimeout(saveTimeout);
		localStorage.setItem(id, val);
		saveTimeout = setTimeout(function () {
			$(document).trigger("event:post-edit-saved");
		}, 1000);
	};

	// initialize all post edit forms
	var editForms = $("form.edit-post-form");
	if (editForms.length) {
		for (var i = 0; i < editForms.length; i++) {
			var $form = $(editForms[i]);
			var title = $form.find("input[name=title]");
			var tags = $form.find("input[name=tags]");
			var titleId = title.attr("id");
			var tagsId = tags.attr("id");

			title.on("keyup", function () {
				$('#post-title').text($(this).val());
			});

			title.val(localStorage.getItem(titleId) || title.val());
			tags.val(localStorage.getItem(tagsId) || tags.val());
	//			M.updateTextFields();
			if (title.length) {
				title.on("change textInput input", function () {
					saveTextToLocalStorage($(this).attr("id"), $(this).val());
				});
			}
			if (tags.length) {
				tags.on("change textInput input", function () {
					saveTextToLocalStorage($(this).attr("id"), $(this).val());
				});
			}
		}
	}

	$(document).on("event:show", ".editbox", function () {
		var txtElem = $(this).find("textarea.edit-post:visible");
		if (txtElem.length) {
			var bodyMDE = initPostEditor(txtElem.get(0));
			bodyMDE.value(localStorage.getItem(txtElem.attr("id")) || bodyMDE.value());
			bodyMDE.codemirror.on("change", function () {
				saveTextToLocalStorage(txtElem.attr("id"), bodyMDE.value());
			});
		}
	});

	submitFormBind("form.edit-post-form", function (data, status, xhr, form) {
		var $form = $(form);
		localStorage.removeItem($form.find("input[name=title]").attr("id"));
		localStorage.removeItem($form.find("textarea[name=body]").attr("id"));
		localStorage.removeItem($form.find("input[name=tags]").attr("id"));
		window.location.hash = "post-" + $(form).closest(".postbox").attr("id");
		window.location.href = data.url || "";
		location.reload();
	}, function (xhr, status, error, form) {
		var hashId = "post-" + $(form).closest(".postbox").attr("id");
		var path = window.location.pathname.replace(/\/edit-post-.*$/, "");
		window.location.href = window.location.origin + path + "/edit-" + hashId;
		location.reload();
	});

	var editingPosts = $(".postbox.resume-editing:first").find(".editlink").click().end();
	if (editingPosts.length) {
		$("html, body").animate({
			scrollTop: editingPosts.first().offset().top
		}, 100);
	}


	$(document).on("click", "a.approve-answer, a.approve-translation", function() {
		var on = "green-text";
		var that = $(this);
		$(".approve-answer, .approve-translation").not(that).removeClass(on);

		if (that.hasClass(on)) {
			that.removeClass(on);
		} else {
			that.addClass(on);
		}

		$.post(this.href);
		return false;
	});

	$(document).on("click", ".delete-post",  function() {
		var dis = $(this);
		var postBox = dis.closest(".postbox");
		return areYouSure(function () {
			startLoading();
			$.post(dis.attr("href"), function () {
				clearLoading();
				if (!postBox.hasClass("replybox")) {
					window.location = CONTEXT_PATH + "/questions?success=true&code=16&deleted=" + postBox.attr("id");
				}
			});
			if (postBox.hasClass("replybox")) {
				postBox.fadeOut("fast", function() {postBox.remove();});
			}
		}, rusuremsg, false);
	});

	$("#follow-thread-check").click(function () {
		var dis = $(this);
		$.post(dis.closest("form").attr("action"), {emailme: dis.is(":checked")});
	});

	if ($("#follow-thread-check").is(":checked")) {
		$(".follow-thread-bell").find("i").toggleClass("fa-bell-o fa-bell red-text");
	}

	$(".follow-thread-bell").click(function () {
		$("#follow-thread-check").click();
		$(this).find("i").toggleClass("fa-bell-o fa-bell red-text");
	});

	if (typeof hljs !== "undefined") {
		$("pre code").each(function (i, block) {
			hljs.highlightBlock(block);
		});
	}

	// small fix for custom checkbox rendering of GFM task lists
	$(".task-list-item>input[type=checkbox]").addClass("filled-in").after("<label style='height:15px'></label>");

	var qfb = $("#question-filter-btn");
	qfb.click(function () {
		if (localStorage.getItem("questionFilterOpen")) {
			localStorage.removeItem("questionFilterOpen");
			$(this).removeClass("grey darken-2 white-text").blur().children("i").removeClass("fa-times").addClass("fa-filter");
		} else {
			var checked = $(".compact-view-checkbox").parent("label").attr("data-compactViewEnabled");
			if (checked === "true") {
				$(".compact-view-checkbox").prop("checked", true);
			} else {
				$(".compact-view-checkbox").prop("checked", false);
			}
			localStorage.setItem("questionFilterOpen", true);
			$(this).addClass("grey darken-2 white-text").children("i").removeClass("fa-filter").addClass("fa-times");
		}
	});

	if (localStorage.getItem("questionFilterOpen")) {
		$("#question-filter-drawer").removeClass("hide");
		qfb.addClass("grey darken-2 white-text").children("i").removeClass("fa-filter").addClass("fa-times");
	}

	$("#question-filter-clear-btn").click(function () {
		qfb.click();
		return true;
	});

	var qfb = $("#user-filter-btn");
	qfb.click(function () {
		if (localStorage.getItem("userFilterOpen")) {
			localStorage.removeItem("userFilterOpen");
			$(this).removeClass("grey darken-2 white-text").blur().children("i").removeClass("fa-times").addClass("fa-filter");
		} else {
			var checked = $(".compact-view-checkbox").parent("label").attr("data-compactViewEnabled");
			if (checked === "true") {
				$(".compact-view-checkbox").prop("checked", true);
			} else {
				$(".compact-view-checkbox").prop("checked", false);
			}
			localStorage.setItem("userFilterOpen", true);
			$(this).addClass("grey darken-2 white-text").children("i").removeClass("fa-filter").addClass("fa-times");
		}
	});

	if (localStorage.getItem("userFilterOpen")) {
		$("#user-filter-drawer").removeClass("hide");
		qfb.addClass("grey darken-2 white-text").children("i").removeClass("fa-filter").addClass("fa-times");
	}

	$("#user-filter-clear-btn").click(function () {
		qfb.click();
		return true;
	});

	var manageBadgesBtn = $("#manage-badges-btn");
	function toggleManageBadgesBtn() {
		$("#badges-selector,#spaces-selector").toggleClass("hide");
		var text = manageBadgesBtn.text();
		manageBadgesBtn.text(manageBadgesBtn.attr("data-alttext")).attr("data-alttext", text);
	}
	manageBadgesBtn.click(function () {
		if (localStorage.getItem("bulkEditBadges")) {
			localStorage.removeItem("bulkEditBadges");
			$("#badges-selector").find("select").val("").formSelect();
		} else {
			localStorage.setItem("bulkEditBadges", true);
		}
		toggleManageBadgesBtn();
	});

	if (localStorage.getItem("bulkEditBadges")) {
		toggleManageBadgesBtn();
	}

	$(".bookmark-spaceurl").hover(function () {
		$(this).find("a:last").toggleClass("hide").on("click", function (e) {
			navigator.clipboard.writeText(this.href);
			$(this).find("i").text("Copied!").attr("class", "green-text smallText").show().fadeOut(3000);
			return false;
		});
	});

	$(".save-question-template").find("a").on("click", function (e) {
		var dis = $(this);
		var txt = dis.text();
		dis.text("Saved!").attr("class", "green-text smallText");
		setTimeout(function () {
			dis.text(txt).attr("class", "");
		}, 3000);
		$.post(dis.attr("href"), {
			title: localStorage.getItem("ask-form-title"),
			body: localStorage.getItem("ask-form-body"),
			tags: localStorage.getItem("ask-form-tags")
		});
		return false;
	});

	$(".open-merge-window").click(function () {
		$(this).closest(".editbox").addClass("hide");
		$(".merge-window").removeClass("hide");
		return false;
	});

	$(".close-merge-window").click(function () {
		$(".open-merge-window").closest(".editbox").removeClass("hide");
		$(".merge-window").addClass("hide");
		return false;
	});

	var listOfQuestionsFound = {};
	var listOfQuestionsFoundData = {};

	$('.merge-window input.autocomplete').autocomplete({
		data: {},
		sortFunction: false,
		limit: 10,
		onAutocomplete: function (el) {
			if (listOfQuestionsFound[el]) {
				$(".merge-window").find("input[name=id2]").val(listOfQuestionsFound[el].id);
			}
		}
	});

	$('.merge-window input.autocomplete').keyup(function (e) {
		// Don't capture enter or arrow key usage.
		if (e.which === 13 || e.which === 38 || e.which === 40) {
			return;
		}
		var instance = M.Autocomplete.getInstance(this);
		$.get(CONTEXT_PATH + "/question/find/" + $(this).val(), function (data) {
			for (var i = 0; i < data.length; i++) {
				listOfQuestionsFoundData[data[i].title] = null;
				listOfQuestionsFound[data[i].title] = data[i];
			}
			instance.updateData(listOfQuestionsFoundData);
			instance.open();
		});
	});

	$(".select-space-template").on("change", function () {
		var selected = $(this).find("option:not([disabled])").filter(":selected").val();
		window.onbeforeunload = function () {return true;};
		window.location.href = CONTEXT_PATH + "/questions/space/" + encodeURIComponent(selected) + "?returnto=/questions/ask";
	});

	/****************************************************
     *                   REVISIONS
     ****************************************************/

	var dmp = new diff_match_patch();

	function diffToHtml(diffs, oldText, newText) {
		var html = [];
		var appendMe = "";
		var done = false;

		function diffMarkup(text, op) {
			var t1,t2 = "";
			switch (op) {
				case 1:  t1 = '<span class="diff-ins">';t2 = '</span>'; break;
				case -1: t1 = '<span class="diff-del">';t2 = '</span>'; break;
				case 0:  t1 = "";t2 = ""; break;
			}

			var trimed = $.trim(text);
			if (trimed !== "") {
				text = t1.concat(text,t2);
			}
			return text;
		}

		//main loop over diff fragments
		var x;
		for (x = 0; x < diffs.length; x++) {
			html[x] = diffMarkup(diffs[x][1], diffs[x][0]);
			if (done) {break;}
		}

		if ($.trim(appendMe) !== "") {
			return appendMe;
		} else {
			return html.join('');
		}
	}

	function diffInit(elem) {
		$(elem).html(function(index, html) {
			var dis = $(this);
			var undiffed = dis.data("undiffedHTML");
			var newText = undiffed || html;
			var oldText = dis.next(".oldrev").html();
			var ds = newText;
			if (!undiffed) {
				dis.data("undiffedHTML", html);
			}
			if (newText && oldText) {
				var d = dmp.diff_main(oldText, newText);
				dmp.diff_cleanupSemantic(d);
				ds = diffToHtml(d, oldText, newText);
			}
			return ds;
		});
	}

	diffInit(".newrev");

	$(document).on("event:page", function() {
		diffInit(".newrev");
	});

	/****************************************************
	 *                    AUTOCOMPLETE
	 ****************************************************/

	var autocomplete = $('.chips-autocomplete');
	var autocompleteValue = $('input[name=tags]').val() || "";
	var autocompleteCache = {};
	var autocompleteDelayTimer;
	var autocompleteInitData = autocompleteValue.split(",").filter(function (t) {
		return t && t.trim().length > 0;
	}).map(function (t) {
		return {tag: t};
	});

	if ("undefined" !== typeof MAX_FAVORITE_TAGS) {
		MAX_TAGS_PER_POST = MAX_FAVORITE_TAGS; // allow more tags to be added on settings page!
	}

	// https://stackoverflow.com/a/38317768/108758
	autocomplete.on({
		focusout: function() {
			$(this).data('autocompleteBlurTimer', setTimeout(function () {
				var input = autocomplete.find("input").first();
				if (input.length && input.val().trim().length) {
					autocomplete.chips('addChip', {tag: input.val().trim()});
					input.val("");
				}
			}.bind(this), 0));
		},
		focusin: function () {
			clearTimeout($(this).data('autocompleteBlurTimer'));
		}
	});

	autocomplete.chips({
		limit: MAX_TAGS_PER_POST,
		placeholder: autocomplete.attr('title') || "Tags",
		data: autocompleteInitData || [],
		autocompleteOptions: {
			data: {},
			minLength: 2
		},
		onChipAdd: function (c) {
			if (autocompleteChipsInstance && !TAG_CREATION_ALLOWED) {
				var txt = autocompleteChipsInstance.chipsData[autocompleteChipsInstance.chipsData.length - 1];
				if (!autocompleteChipsInstance.autocomplete.options.data.hasOwnProperty(txt.tag)) {
					autocompleteChipsInstance.deleteChip(autocompleteChipsInstance.chipsData.length - 1);
				}
			}
			$(c).find('i.close').text("");
			autocomplete.next('input[type=hidden]').val(this.chipsData.map(function (c) {
				return c.tag;
			}).join(',')).trigger('change');
		},
		onChipDelete: function () {
			autocomplete.next('input[type=hidden]').val(this.chipsData.map(function (c) {
				return c.tag;
			}).join(',')).trigger('change');
		}
	}).find('i.close').text("");

	if (autocomplete.length) {
		var autocompleteChipsInstance = M.Chips.getInstance(autocomplete.get(0));
		function autocompleteFetchData(value, callback) {
			var val = value.toLowerCase().trim();
			if (val && val.length > 0) {
				$.get(CONTEXT_PATH + "/tags/" + val, function (data) {
					var tags = {};
					//if (data.length === 0) {data.push({tag: val});}
					data.map(function (t) {
						tags[t.tag] = null;
					});
					callback(val, tags);
				});
			}
		}
		function autocompleteFetchCallback(value, list) {
			if (!autocompleteCache.hasOwnProperty(value)) {
				autocompleteCache[value] = list;
			}
			if (autocompleteChipsInstance && autocompleteChipsInstance.hasAutocomplete) {
				autocompleteChipsInstance.autocomplete.updateData(list);
				autocompleteChipsInstance.autocomplete.open();
			}
		}

		autocomplete.on('input', function () {
			var value = $(this).find('input:first').val().toUpperCase();

			if (autocompleteCache.hasOwnProperty(value) && autocompleteCache[value]) {
				autocompleteFetchCallback(value, autocompleteCache[value]);
			} else {
				clearTimeout(autocompleteDelayTimer);
				autocompleteDelayTimer = setTimeout(function () {
					autocompleteFetchData(value, autocompleteFetchCallback);
				}, 400);
			}
			return true;
		});
	}

	if (window.location.pathname.indexOf(CONTEXT_PATH + '/signin/') >= 0) {
		var passwordInput = $('#passw, #newpassword');
		var scoreMessage = $('#pass-meter-message');
		var messagesList = ['Too simple', 'Weak', 'Good', 'Strong', 'Very strong'];
		passwordInput.on('keyup', function () {
			var score = 0;
			var val = passwordInput.val();
			if (val.length >= (MIN_PASS_LENGTH || 8)) {
				++score;
			}
			if (val.match(/(?=.*[a-z])/)) {
				++score;
			}
			if (val.match(/(?=.*[A-Z])/)) {
				++score;
			}
			if (val.match(/(?=.*[0-9])/)) {
				++score;
			}
			if (val.match(/(?=.*[^\w\s\n\t])/)) {
				++score;
			}
			if (val.length === 0) {
				score = -1;
			}
			switch (score) {
				case 0:
				case 1:
					passwordInput.attr('class', 'pass-meter');
					scoreMessage.text(messagesList[0]);
					break;
				case 2:
					passwordInput.attr('class', 'pass-meter psms-25');
					scoreMessage.text(messagesList[1]);
					break;
				case 3:
					passwordInput.attr('class', 'pass-meter psms-50');
					scoreMessage.text(messagesList[2]);
					break;
				case 4:
					passwordInput.attr('class', 'pass-meter psms-75');
					scoreMessage.text(messagesList[3]);
					break;
				case 5:
					passwordInput.attr('class', 'pass-meter psms-100');
					scoreMessage.text(messagesList[4]);
					break;
				default:
					passwordInput.attr('class', '');
					scoreMessage.text('');
			}
		});
	}

	/**************************
	 *    Notifications System
	 **************************/

	// Notification management
	var notificationCount = 0;
	var notifications = [];
	var notificationPollingInterval;
	var lastNotificationCheck = 0;
	var notificationCheckThrottle = 5000; // 5 seconds minimum between checks

	function initNotifications() {
		if ($('.notification-bell').length > 0) {
			loadUnreadNotifications();
			setupNotificationEvents();
			startNotificationPolling();
		}
	}

	function loadUnreadNotifications() {
		var now = Date.now();
		// Throttle requests to prevent too frequent API calls
		if (now - lastNotificationCheck < notificationCheckThrottle) {
			return;
		}
		lastNotificationCheck = now;

		// Show loading state in dropdown
		var container = $('.notifications-list');
		container.html('<li class="notification-loading"><i class="fa fa-spinner fa-spin"></i> Loading...</li>');

		$.ajax({
			url: CONTEXT_PATH + '/notifications/unread',
			type: 'GET',
			dataType: 'json',
			timeout: 10000, // 10 second timeout
			success: function(data) {
				updateNotificationBadge(data.count || 0);
				updateNotificationDropdown(data.notifications || []);
			},
			error: function(xhr, status, error) {
				console.error('Failed to load notifications:', error);
				// Show error in dropdown
				container.html('<li class="notification-item"><span class="grey-text">Failed to load notifications</span></li>');
				// Still update badge to 0 to prevent stale counts
				updateNotificationBadge(0);
			}
		});
	}

	function updateNotificationBadge(count) {
		notificationCount = count;
		var badge = $('#notification-count');
		var mobileBadge = $('#mobile-notification-count');

		if (count > 0) {
			var displayCount = count > 99 ? '99+' : count;
			badge.text(displayCount);
			badge.removeClass('hide');
			mobileBadge.text(displayCount);
			mobileBadge.removeClass('hide');
		} else {
			badge.addClass('hide');
			mobileBadge.addClass('hide');
		}
	}

	function updateNotificationDropdown(notificationList) {
		notifications = notificationList;
		var container = $('.notifications-list');
		container.empty();

		if (notificationList.length === 0) {
			container.append('<li class="no-notifications"><span class="grey-text">No new notifications</span></li>');
		} else {
			notificationList.forEach(function(notification) {
				var notificationHtml = createNotificationItem(notification);
				container.append(notificationHtml);
			});
		}
	}

	function createNotificationItem(notification) {
		var timeAgo = formatTimeAgo(notification.createdAt || notification.timestamp);
		var unreadClass = notification.read === false ? 'unread' : '';
		var typeLabel = getNotificationTypeLabel(notification.type);

		return $('<li>')
			.addClass('notification-item ' + unreadClass)
			.attr('data-notification-id', notification.id)
			.html(
				'<div class="notification-content">' +
					'<p class="notification-message">' + escapeHtml(notification.message || '') + '</p>' +
					'<div class="notification-meta">' +
						'<span class="notification-type">' + typeLabel + '</span>' +
						'<span class="notification-time">' + timeAgo + '</span>' +
					'</div>' +
				'</div>'
			);
	}

	function getNotificationTypeLabel(type) {
		var typeLabels = {
			'answer': 'Answer',
			'comment': 'Comment',
			'vote': 'Vote',
			'question': 'Question',
			'mention': 'Mention',
			'follow': 'Follow'
		};
		return typeLabels[type] || 'Update';
	}

	function formatTimeAgo(timestamp) {
		if (!timestamp) return 'Just now';

		var now = new Date();
		var time = new Date(timestamp);
		var diffInSeconds = Math.floor((now - time) / 1000);

		if (diffInSeconds < 60) return 'Just now';
		if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + 'm ago';
		if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + 'h ago';
		if (diffInSeconds < 604800) return Math.floor(diffInSeconds / 86400) + 'd ago';

		return time.toLocaleDateString();
	}

	function escapeHtml(text) {
		var map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return text.replace(/[&<>"']/g, function(m) { return map[m]; });
	}

	function setupNotificationEvents() {
		// Refresh notifications when dropdown is opened
		$(document).on('click', '.notification-bell', function() {
			// Small delay to ensure dropdown is open
			setTimeout(function() {
				loadUnreadNotifications();
			}, 100);
		});

		// Handle notification item clicks
		$(document).on('click', '.notification-item', function() {
			var notificationId = $(this).data('notification-id');
			var notification = notifications.find(n => n.id === notificationId);

			if (notification) {
				markNotificationAsRead(notificationId);

				// Navigate to the related content if URL is available
				if (notification.questionURI || notification.objectURL) {
					var url = notification.questionURI || notification.objectURL;
					window.location.href = CONTEXT_PATH + url;
				}
			}
		});

		// Handle mark all as read
		$(document).on('click', '.mark-all-read', function(e) {
			e.preventDefault();
			markAllNotificationsAsRead();
		});

		// Handle view all notifications
		$(document).on('click', '.view-all-notifications', function(e) {
			e.preventDefault();
			window.location.href = CONTEXT_PATH + '/notifications';
		});

		// Handle mobile notifications link
		$(document).on('click', '.mobile-notifications-link', function(e) {
			e.preventDefault();
			window.location.href = CONTEXT_PATH + '/notifications';
		});
	}

	function markNotificationAsRead(notificationId) {
		$.ajax({
			url: CONTEXT_PATH + '/notifications/' + notificationId + '/read',
			type: 'POST',
			success: function() {
				// Update UI immediately
				var item = $('.notification-item[data-notification-id="' + notificationId + '"]');
				item.removeClass('unread');

				// Update badge count
				if (notificationCount > 0) {
					updateNotificationBadge(notificationCount - 1);
				}
			},
			error: function(xhr, status, error) {
				console.error('Failed to mark notification as read:', error);
			}
		});
	}

	function markAllNotificationsAsRead() {
		$.ajax({
			url: CONTEXT_PATH + '/notifications/read-all',
			type: 'POST',
			success: function() {
				// Update UI
				$('.notification-item').removeClass('unread');
				updateNotificationBadge(0);
			},
			error: function(xhr, status, error) {
				console.error('Failed to mark all notifications as read:', error);
			}
		});
	}

	function startNotificationPolling() {
		// Poll for new notifications every 30 seconds
		notificationPollingInterval = setInterval(function() {
			loadUnreadNotifications();
		}, 30000);
	}

	function stopNotificationPolling() {
		if (notificationPollingInterval) {
			clearInterval(notificationPollingInterval);
		}
	}

	// Initialize notifications when document is ready
	initNotifications();

	// Clean up polling when page unloads
	$(window).on('beforeunload', function() {
		stopNotificationPolling();
	});

});
