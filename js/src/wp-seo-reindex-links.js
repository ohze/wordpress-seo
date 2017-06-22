/* global yoastReindexLinksData, jQuery, tb_remove */

let settings = yoastReindexLinksData.data;

import a11ySpeak from "a11y-speak";

/**
 * Represents the progressbar for the reindexing for the links.
 */
class IndexProgressBar {

	/**
	 * The constructor.
	 *
	 * @param {string} postType The post type.
	 * @param {int}    total    The total amount of items for post type.
	 */
	constructor( postType, total ) {
		this.element = jQuery( "#wpseo_count_index_links_" + postType );
		this.progressbarTarget = jQuery( "#wpseo_index_links_" + postType + "_progressbar" ).progressbar( { value: 0 } );
		this.total = parseInt( total, 10 );
		this.totalProcessed = 0;
	}

	/**
	 * Updates the processbar.
	 *
	 * @param {int} countProcessed The amount of items that has been process.
	 *
	 * @returns {void}
	 */
	update( countProcessed ) {
		this.totalProcessed += countProcessed;
		let newWidth = this.totalProcessed * ( 100 / this.total );

		this.progressbarTarget.progressbar( "value", Math.round( newWidth ) );
		this.element.html( this.totalProcessed );
	}

	/**
	 * Completes the processbar.
	 *
	 * @returns {void}
	 */
	complete() {
		this.progressbarTarget.progressbar( "value", 100 );
	}

}

/**
 * Does the reindex request for current post and
 *
 * @param {string}           postType    The postttype to reindex.
 * @param {IndexProgressBar} progressbar The progressbar.
 * @param {Promise.resolve}  resolve     The method to complete index process.
 *
 * @returns {void}
 */
function doReindexRequest( postType, progressbar, resolve ) {
	// Do
	jQuery.ajax( {
		type: "GET",
		url: settings.restApi.root + settings.restApi.endpoint,
		data: {
			postType: postType,
		},
		beforeSend: ( xhr ) => {
			xhr.setRequestHeader( "X-WP-Nonce", settings.restApi.nonce );
		},
		success: function( response ) {
			let totalIndexed = parseInt( response, 10 );
			if ( totalIndexed !== 0 ) {
				progressbar.update( totalIndexed );

				doReindexRequest( postType, progressbar, resolve );

				return;
			}

			progressbar.complete();
			resolve();
		},
	} );
}

/**
 * Starts the reindexing the links for given post type.
 *
 * @param {string} postType The posttype to reindex.
 *
 * @returns {Promise} Promise.
 */
function reindexLinks( postType ) {

	// Do request to get post ids
	return new Promise( ( resolve ) => {
		let progressbar = new IndexProgressBar( postType, settings.amount[ postType ] );
		doReindexRequest( postType, progressbar, resolve );
	} );
}

/**
 * Sets the finish message, when indexing has been completed.
 *
 * @returns {void}
 */
function completeReindexing() {
	a11ySpeak( settings.l10n.calculationCompleted );

	jQuery( "#reindexLinks" ).html( settings.message.indexingCompleted );

	// tb_remove();
}

/**
 * Starts the reindexing of the links.
 *
 * @returns {void}
 */
function startReindexing() {
	a11ySpeak( settings.l10n.calculationInProgress );

	reindexLinks( "post" )
		.then( reindexLinks( "page" ) )
		.then( completeReindexing );
}

/**
 * Initializes the indexation of links
 *
 * @returns {void}
 */
function init() {
	let recalculating = false;
	jQuery( ".yoast-js-calculate-index-links--all " ).on( "click", function() {
		if( recalculating === false ) {
			startReindexing();

			recalculating = true;
		}
	} );
}

jQuery( init );
