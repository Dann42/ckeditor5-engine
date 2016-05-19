/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global console:false */

'use strict';

import Document from '/ckeditor5/engine/view/document.js';
import MutationObserver from '/ckeditor5/engine/view/observer/mutationobserver.js';
import SelectionObserver from '/ckeditor5/engine/view/observer/selectionobserver.js';
import { setData } from '/tests/engine/_utils/view.js';

const viewDocument = new Document();
viewDocument.createRoot( document.getElementById( 'editor' ) );

viewDocument.addObserver( MutationObserver );
viewDocument.addObserver( SelectionObserver );

setData( viewDocument,
	'<container:p><attribute:b>foo</attribute:b>bar</container:p>' +
	'<container:p>bom</container:p>' );

viewDocument.on( 'selectionChange', ( evt, data ) => {
	console.log( data );
	viewDocument.selection.setTo( data.newSelection );
} );

viewDocument.render();