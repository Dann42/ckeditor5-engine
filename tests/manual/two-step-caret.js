/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global console, document */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';

import bindTwoStepCaretToAttribute from '../../src/utils/bindtwostepcarettoattribute';

ClassicEditor
	.create( document.querySelector( '#editor' ), {
		plugins: [ Essentials, Paragraph, Underline, Bold, Italic ],
		toolbar: [ 'undo', 'redo', '|', 'bold', 'underline', 'italic' ]
	} )
	.then( editor => {
		const bold = editor.plugins.get( Italic );
		const underline = editor.plugins.get( Underline );

		bindTwoStepCaretToAttribute( editor.editing.view, editor.model, bold, 'italic' );
		bindTwoStepCaretToAttribute( editor.editing.view, editor.model, underline, 'underline' );
	} )
	.catch( err => {
		console.error( err.stack );
	} );