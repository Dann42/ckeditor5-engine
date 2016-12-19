/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Document from 'ckeditor5/engine/model/document.js';
import DataController from 'ckeditor5/engine/controller/datacontroller.js';
import insertContent from 'ckeditor5/engine/controller/insertcontent.js';

import DocumentFragment from 'ckeditor5/engine/model/documentfragment.js';
import Text from 'ckeditor5/engine/model/text.js';

import { setData, getData, parse } from 'ckeditor5/engine/dev-utils/model.js';

describe( 'DataController', () => {
	let doc, dataController;

	describe( 'insertContent', () => {
		it( 'uses the passed batch', () => {
			doc = new Document();
			doc.createRoot();
			doc.schema.allow( { name: '$text', inside: '$root' } );

			dataController = new DataController( doc );

			const batch = doc.batch();

			setData( doc, 'x[]x' );

			insertContent( dataController, new DocumentFragment( [ new Text( 'a' ) ] ), doc.selection, batch );

			expect( batch.deltas.length ).to.be.above( 0 );
		} );

		describe( 'in simple scenarios', () => {
			beforeEach( () => {
				doc = new Document();
				doc.createRoot();

				dataController = new DataController( doc );

				const schema = doc.schema;

				schema.registerItem( 'image', '$inline' );
				schema.registerItem( 'disallowedElement' );

				schema.allow( { name: '$text', inside: '$root' } );
				schema.allow( { name: 'image', inside: '$root' } );
				// Otherwise it won't be passed to the temporary model fragment used inside insert().
				schema.allow( { name: 'disallowedElement', inside: '$clipboardHolder' } );
				doc.schema.allow( { name: '$text', inside: 'disallowedElement' } );

				schema.allow( { name: '$inline', attributes: [ 'bold' ] } );
				schema.allow( { name: '$inline', attributes: [ 'italic' ] } );

				schema.objects.add( 'image' );
			} );

			it( 'inserts one text node', () => {
				setData( doc, 'f[]oo' );
				insertHelper( 'xyz' );
				expect( getData( doc ) ).to.equal( 'fxyz[]oo' );
			} );

			it( 'inserts one text node (at the end)', () => {
				setData( doc, 'foo[]' );
				insertHelper( 'xyz' );
				expect( getData( doc ) ).to.equal( 'fooxyz[]' );
			} );

			it( 'inserts one text node with attribute', () => {
				setData( doc, 'f[]oo' );
				insertHelper( '<$text bold="true">xyz</$text>' );
				expect( getData( doc ) ).to.equal( 'f<$text bold="true">xyz[]</$text>oo' );

				expect( doc.selection.getAttribute( 'bold' ) ).to.be.true;
			} );

			it( 'inserts one text node with attribute into text with a different attribute', () => {
				setData( doc, '<$text bold="true">f[]oo</$text>' );
				insertHelper( '<$text italic="true">xyz</$text>' );
				expect( getData( doc ) )
					.to.equal( '<$text bold="true">f</$text><$text italic="true">xyz[]</$text><$text bold="true">oo</$text>' );

				expect( doc.selection.getAttribute( 'italic' ) ).to.be.true;
				expect( doc.selection.hasAttribute( 'bold' ) ).to.be.false;
			} );

			it( 'inserts one text node with attribute into text with the same attribute', () => {
				setData( doc, '<$text bold="true">f[]oo</$text>' );
				insertHelper( '<$text bold="true">xyz</$text>' );
				expect( getData( doc ) )
					.to.equal( '<$text bold="true">fxyz[]oo</$text>' );

				expect( doc.selection.getAttribute( 'bold' ) ).to.be.true;
			} );

			it( 'inserts a text without attributes into a text with an attribute', () => {
				setData( doc, '<$text bold="true">f[]oo</$text>' );
				insertHelper( 'xyz' );
				expect( getData( doc ) ).to.equal( '<$text bold="true">f</$text>xyz[]<$text bold="true">oo</$text>' );

				expect( doc.selection.hasAttribute( 'bold' ) ).to.be.false;
			} );

			it( 'inserts an element', () => {
				setData( doc, 'f[]oo' );
				insertHelper( '<image></image>' );
				expect( getData( doc ) ).to.equal( 'f<image></image>[]oo' );
			} );

			it( 'inserts a text and an element', () => {
				setData( doc, 'f[]oo' );
				insertHelper( 'xyz<image></image>' );
				expect( getData( doc ) ).to.equal( 'fxyz<image></image>[]oo' );
			} );

			it( 'strips a disallowed element', () => {
				setData( doc, 'f[]oo' );
				insertHelper( '<disallowedElement>xyz</disallowedElement>' );
				expect( getData( doc ) ).to.equal( 'fxyz[]oo' );
			} );

			it( 'deletes selection before inserting the content', () => {
				setData( doc, 'f[abc]oo' );
				insertHelper( 'x' );
				expect( getData( doc ) ).to.equal( 'fx[]oo' );
			} );

			describe( 'spaces handling', () => {
				// Note: spaces in the view are not encoded like in the DOM, so subsequent spaces must be
				// inserted into the model as is. The conversion to nbsps happen on view<=>DOM conversion.

				it( 'inserts one space', () => {
					setData( doc, 'f[]oo' );
					insertHelper( new Text( ' ' ) );
					expect( getData( doc ) ).to.equal( 'f []oo' );
				} );

				it( 'inserts three spaces', () => {
					setData( doc, 'f[]oo' );
					insertHelper( new Text( '   ' ) );
					expect( getData( doc ) ).to.equal( 'f   []oo' );
				} );

				it( 'inserts spaces at the end', () => {
					setData( doc, 'foo[]' );
					insertHelper( new Text( '   ' ) );
					expect( getData( doc ) ).to.equal( 'foo   []' );
				} );

				it( 'inserts one nbsp', () => {
					setData( doc, 'f[]oo' );
					insertHelper( new Text( '\u200a' ) );
					expect( getData( doc ) ).to.equal( 'f\u200a[]oo' );
				} );

				it( 'inserts word surrounded by spaces', () => {
					setData( doc, 'f[]oo' );
					insertHelper( new Text( ' xyz  ' ) );
					expect( getData( doc ) ).to.equal( 'f xyz  []oo' );
				} );
			} );
		} );

		describe( 'in blocks', () => {
			beforeEach( () => {
				doc = new Document();
				doc.createRoot();

				dataController = new DataController( doc );

				const schema = doc.schema;

				schema.registerItem( 'paragraph', '$block' );
				schema.registerItem( 'heading1', '$block' );
				schema.registerItem( 'heading2', '$block' );
				schema.registerItem( 'blockWidget' );
				schema.registerItem( 'inlineWidget' );
				schema.registerItem( 'listItem', '$block' );

				schema.allow( { name: 'blockWidget', inside: '$root' } );
				schema.allow( { name: 'inlineWidget', inside: '$block' } );
				schema.allow( { name: 'inlineWidget', inside: '$clipboardHolder' } );
				schema.allow( {
					name: 'listItem',
					inside: '$root',
					attributes: [ 'type', 'indent' ]
				} );
				schema.requireAttributes( 'listItem', [ 'type', 'indent' ] );

				schema.objects.add( 'blockWidget' );
				schema.objects.add( 'inlineWidget' );
			} );

			it( 'inserts one text node', () => {
				setData( doc, '<paragraph>f[]oo</paragraph>' );
				insertHelper( 'xyz' );
				expect( getData( doc ) ).to.equal( '<paragraph>fxyz[]oo</paragraph>' );
			} );

			it( 'inserts one text node to fully selected paragraph', () => {
				setData( doc, '<paragraph>[foo]</paragraph>' );
				insertHelper( 'xyz' );
				expect( getData( doc ) ).to.equal( '<paragraph>xyz[]</paragraph>' );
			} );

			it( 'inserts one text node to fully selected paragraphs (from outside)', () => {
				setData( doc, '[<paragraph>foo</paragraph><paragraph>bar</paragraph>]' );
				insertHelper( 'xyz' );
				expect( getData( doc ) ).to.equal( '<paragraph>xyz[]</paragraph>' );
			} );

			it( 'merges two blocks before inserting content (p+p)', () => {
				setData( doc, '<paragraph>fo[o</paragraph><paragraph>b]ar</paragraph>' );
				insertHelper( 'xyz' );
				expect( getData( doc ) ).to.equal( '<paragraph>foxyz[]ar</paragraph>' );
			} );

			it( 'inserts inline widget and text', () => {
				setData( doc, '<paragraph>f[]oo</paragraph>' );
				insertHelper( 'xyz<inlineWidget></inlineWidget>' );
				expect( getData( doc ) ).to.equal( '<paragraph>fxyz<inlineWidget></inlineWidget>[]oo</paragraph>' );
			} );

			// Note: In CKEditor 4 the blocks are not merged, but to KISS we're merging here
			// because that's what deleteContent() does.
			it( 'merges two blocks before inserting content (h+p)', () => {
				setData( doc, '<heading1>fo[o</heading1><paragraph>b]ar</paragraph>' );
				insertHelper( 'xyz' );
				expect( getData( doc ) ).to.equal( '<heading1>foxyz[]ar</heading1>' );
			} );

			describe( 'block to block handling', () => {
				it( 'inserts one paragraph', () => {
					setData( doc, '<paragraph>f[]oo</paragraph>' );
					insertHelper( '<paragraph>xyz</paragraph>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fxyz[]oo</paragraph>' );
				} );

				it( 'inserts one paragraph (at the end)', () => {
					setData( doc, '<paragraph>foo[]</paragraph>' );
					insertHelper( '<paragraph>xyz</paragraph>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fooxyz[]</paragraph>' );
				} );

				it( 'inserts one paragraph into an empty paragraph', () => {
					setData( doc, '<paragraph>[]</paragraph>' );
					insertHelper( '<paragraph>xyz</paragraph>' );
					expect( getData( doc ) ).to.equal( '<paragraph>xyz[]</paragraph>' );
				} );

				it( 'inserts one block into a fully selected content', () => {
					setData( doc, '<heading1>[foo</heading1><paragraph>bar]</paragraph>' );
					insertHelper( '<heading2>xyz</heading2>' );
					expect( getData( doc ) ).to.equal( '<heading2>xyz[]</heading2>' );
				} );

				it( 'inserts one heading', () => {
					setData( doc, '<paragraph>f[]oo</paragraph>' );
					insertHelper( '<heading1>xyz</heading1>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fxyz[]oo</paragraph>' );
				} );

				it( 'inserts two headings', () => {
					setData( doc, '<paragraph>f[]oo</paragraph>' );
					insertHelper( '<heading1>xxx</heading1><heading1>yyy</heading1>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fxxx</paragraph><heading1>yyy[]oo</heading1>' );
				} );

				it( 'inserts one object', () => {
					setData( doc, '<paragraph>f[]oo</paragraph>' );
					insertHelper( '<blockWidget></blockWidget>' );
					expect( getData( doc ) ).to.equal( '<paragraph>f</paragraph>[<blockWidget></blockWidget>]<paragraph>oo</paragraph>' );
				} );

				it( 'inserts one object (at the end)', () => {
					setData( doc, '<paragraph>foo[]</paragraph>' );
					insertHelper( '<blockWidget></blockWidget>' );
					expect( getData( doc ) ).to.equal( '<paragraph>foo</paragraph>[<blockWidget></blockWidget>]' );
				} );

				it( 'inserts one object (at the beginning)', () => {
					setData( doc, '<paragraph>[]bar</paragraph>' );
					insertHelper( '<blockWidget></blockWidget>' );
					expect( getData( doc ) ).to.equal( '[<blockWidget></blockWidget>]<paragraph>bar</paragraph>' );
				} );

				it( 'inserts one list item', () => {
					setData( doc, '<paragraph>f[]oo</paragraph>' );
					insertHelper( '<listItem indent="0" type="bulleted">xyz</listItem>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fxyz[]oo</paragraph>' );
				} );

				it( 'inserts list item to empty element', () => {
					setData( doc, '<paragraph>[]</paragraph>' );
					insertHelper( '<listItem indent="0" type="bulleted">xyz</listItem>' );
					expect( getData( doc ) ).to.equal( '<listItem indent="0" type="bulleted">xyz[]</listItem>' );
				} );

				it( 'inserts three list items at the end of paragraph', () => {
					setData( doc, '<paragraph>foo[]</paragraph>' );
					insertHelper(
						'<listItem indent="0" type="bulleted">xxx</listItem>' +
						'<listItem indent="0" type="bulleted">yyy</listItem>' +
						'<listItem indent="0" type="bulleted">zzz</listItem>'
					);
					expect( getData( doc ) ).to.equal(
						'<paragraph>fooxxx</paragraph>' +
						'<listItem indent="0" type="bulleted">yyy</listItem>' +
						'<listItem indent="0" type="bulleted">zzz[]</listItem>'
					);
				} );

				it( 'inserts two list items to an empty paragraph', () => {
					setData( doc, '<paragraph>a</paragraph><paragraph>[]</paragraph><paragraph>b</paragraph>' );
					insertHelper(
						'<listItem indent="0" type="bulleted">xxx</listItem>' +
						'<listItem indent="0" type="bulleted">yyy</listItem>'
					);
					expect( getData( doc ) ).to.equal(
						'<paragraph>a</paragraph>' +
						'<listItem indent="0" type="bulleted">xxx</listItem>' +
						'<listItem indent="0" type="bulleted">yyy[]</listItem>' +
						'<paragraph>b</paragraph>'
					);
				} );
			} );

			describe( 'mixed content to block', () => {
				it( 'inserts text + paragraph', () => {
					setData( doc, '<paragraph>f[]oo</paragraph>' );
					insertHelper( 'xxx<paragraph>yyy</paragraph>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fxxx</paragraph><paragraph>yyy[]oo</paragraph>' );
				} );

				it( 'inserts text + inlineWidget + text + paragraph', () => {
					setData( doc, '<paragraph>f[]oo</paragraph>' );
					insertHelper( 'xxx<inlineWidget></inlineWidget>yyy<paragraph>zzz</paragraph>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fxxx<inlineWidget></inlineWidget>yyy</paragraph><paragraph>zzz[]oo</paragraph>' );
				} );

				it( 'inserts text + paragraph (at the beginning)', () => {
					setData( doc, '<paragraph>[]foo</paragraph>' );
					insertHelper( 'xxx<paragraph>yyy</paragraph>' );
					expect( getData( doc ) ).to.equal( '<paragraph>xxx</paragraph><paragraph>yyy[]foo</paragraph>' );
				} );

				it( 'inserts text + paragraph (at the end)', () => {
					setData( doc, '<paragraph>foo[]</paragraph>' );
					insertHelper( 'xxx<paragraph>yyy</paragraph>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fooxxx</paragraph><paragraph>yyy[]</paragraph>' );
				} );

				it( 'inserts paragraph + text', () => {
					setData( doc, '<paragraph>f[]oo</paragraph>' );
					insertHelper( '<paragraph>yyy</paragraph>xxx' );
					expect( getData( doc ) ).to.equal( '<paragraph>fyyy</paragraph><paragraph>xxx[]oo</paragraph>' );
				} );

				// This is the expected result, but it was so hard to achieve at this stage that I
				// decided to go with the what the next test represents.
				// it( 'inserts paragraph + text + inlineWidget + text', () => {
				// 	setData( doc, '<paragraph>f[]oo</paragraph>' );
				// 	insertHelper( '<paragraph>yyy</paragraph>xxx<inlineWidget></inlineWidget>zzz' );
				// 	expect( getData( doc ) )
				// 		.to.equal( '<paragraph>fyyy</paragraph><paragraph>xxx<inlineWidget></inlineWidget>zzz[]oo</paragraph>' );
				// } );

				// See the comment above.
				it( 'inserts paragraph + text + inlineWidget + text', () => {
					setData( doc, '<paragraph>f[]oo</paragraph>' );
					insertHelper( '<paragraph>yyy</paragraph>xxx<inlineWidget></inlineWidget>zzz' );
					expect( getData( doc ) ).to.equal(
						'<paragraph>fyyy</paragraph><paragraph>xxx</paragraph>' +
						'<paragraph><inlineWidget></inlineWidget></paragraph>' +
						'<paragraph>zzz[]oo</paragraph>'
					);
				} );

				it( 'inserts paragraph + text + paragraph', () => {
					setData( doc, '<paragraph>f[]oo</paragraph>' );
					insertHelper( '<paragraph>yyy</paragraph>xxx<paragraph>zzz</paragraph>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fyyy</paragraph><paragraph>xxx</paragraph><paragraph>zzz[]oo</paragraph>' );
				} );

				it( 'inserts paragraph + text (at the beginning)', () => {
					setData( doc, '<paragraph>[]foo</paragraph>' );
					insertHelper( '<paragraph>yyy</paragraph>xxx' );
					expect( getData( doc ) ).to.equal( '<paragraph>yyy</paragraph><paragraph>xxx[]foo</paragraph>' );
				} );

				it( 'inserts paragraph + text (at the end)', () => {
					setData( doc, '<paragraph>foo[]</paragraph>' );
					insertHelper( '<paragraph>yyy</paragraph>xxx' );
					expect( getData( doc ) ).to.equal( '<paragraph>fooyyy</paragraph><paragraph>xxx[]</paragraph>' );
				} );

				it( 'inserts text + heading', () => {
					setData( doc, '<paragraph>f[]oo</paragraph>' );
					insertHelper( 'xxx<heading1>yyy</heading1>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fxxx</paragraph><heading1>yyy[]oo</heading1>' );
				} );

				it( 'inserts paragraph + object', () => {
					setData( doc, '<paragraph>f[]oo</paragraph>' );
					insertHelper( '<paragraph>xxx</paragraph><blockWidget></blockWidget>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fxxx</paragraph>[<blockWidget></blockWidget>]<paragraph>oo</paragraph>' );
				} );

				it( 'inserts object + paragraph', () => {
					setData( doc, '<paragraph>f[]oo</paragraph>' );
					insertHelper( '<blockWidget></blockWidget><paragraph>xxx</paragraph>' );
					expect( getData( doc ) ).to.equal( '<paragraph>f</paragraph><blockWidget></blockWidget><paragraph>xxx[]oo</paragraph>' );
				} );
			} );

			describe( 'content over a block object', () => {
				it( 'inserts text', () => {
					setData( doc, '<paragraph>foo</paragraph>[<blockWidget></blockWidget>]<paragraph>bar</paragraph>' );
					insertHelper( 'xxx' );
					expect( getData( doc ) ).to.equal( '<paragraph>foo</paragraph><paragraph>xxx[]</paragraph><paragraph>bar</paragraph>' );
				} );

				it( 'inserts paragraph', () => {
					setData( doc, '<paragraph>foo</paragraph>[<blockWidget></blockWidget>]<paragraph>bar</paragraph>' );
					insertHelper( '<paragraph>xxx</paragraph>' );
					expect( getData( doc ) ).to.equal( '<paragraph>foo</paragraph><paragraph>xxx[]</paragraph><paragraph>bar</paragraph>' );
				} );

				it( 'inserts text + paragraph', () => {
					setData( doc, '<paragraph>foo</paragraph>[<blockWidget></blockWidget>]<paragraph>bar</paragraph>' );
					insertHelper( 'yyy<paragraph>xxx</paragraph>' );
					expect( getData( doc ) )
						.to.equal( '<paragraph>foo</paragraph><paragraph>yyy</paragraph><paragraph>xxx[]</paragraph><paragraph>bar</paragraph>' );
				} );

				it( 'inserts two blocks', () => {
					setData( doc, '<paragraph>foo</paragraph>[<blockWidget></blockWidget>]<paragraph>bar</paragraph>' );
					insertHelper( '<heading1>xxx</heading1><paragraph>yyy</paragraph>' );
					expect( getData( doc ) )
						.to.equal( '<paragraph>foo</paragraph><heading1>xxx</heading1><paragraph>yyy[]</paragraph><paragraph>bar</paragraph>' );
				} );

				it( 'inserts block object', () => {
					setData( doc, '<paragraph>foo</paragraph>[<blockWidget></blockWidget>]<paragraph>bar</paragraph>' );
					insertHelper( '<blockWidget></blockWidget>' );
					// It's enough, don't worry.
					expect( getData( doc ) ).to.equal( '<paragraph>foo</paragraph>[<blockWidget></blockWidget>]<paragraph>bar</paragraph>' );
				} );

				it( 'inserts inline object', () => {
					setData( doc, '<paragraph>foo</paragraph>[<blockWidget></blockWidget>]<paragraph>bar</paragraph>' );
					insertHelper( '<inlineWidget></inlineWidget>' );
					expect( getData( doc ) )
						.to.equal( '<paragraph>foo</paragraph><paragraph><inlineWidget></inlineWidget>[]</paragraph><paragraph>bar</paragraph>' );
				} );
			} );

			describe( 'content over an inline object', () => {
				it( 'inserts text', () => {
					setData( doc, '<paragraph>foo[<inlineWidget></inlineWidget>]bar</paragraph>' );
					insertHelper( 'xxx' );
					expect( getData( doc ) ).to.equal( '<paragraph>fooxxx[]bar</paragraph>' );
				} );

				it( 'inserts paragraph', () => {
					setData( doc, '<paragraph>foo[<inlineWidget></inlineWidget>]bar</paragraph>' );
					insertHelper( '<paragraph>xxx</paragraph>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fooxxx[]bar</paragraph>' );
				} );

				it( 'inserts text + paragraph', () => {
					setData( doc, '<paragraph>foo[<inlineWidget></inlineWidget>]bar</paragraph>' );
					insertHelper( 'yyy<paragraph>xxx</paragraph>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fooyyy</paragraph><paragraph>xxx[]bar</paragraph>' );
				} );

				it( 'inserts two blocks', () => {
					setData( doc, '<paragraph>foo[<inlineWidget></inlineWidget>]bar</paragraph>' );
					insertHelper( '<heading1>xxx</heading1><paragraph>yyy</paragraph>' );
					expect( getData( doc ) ).to.equal( '<paragraph>fooxxx</paragraph><paragraph>yyy[]bar</paragraph>' );
				} );

				it( 'inserts inline object', () => {
					setData( doc, '<paragraph>foo[<inlineWidget></inlineWidget>]bar</paragraph>' );
					insertHelper( '<inlineWidget></inlineWidget>' );
					expect( getData( doc ) ).to.equal( '<paragraph>foo<inlineWidget></inlineWidget>[]bar</paragraph>' );
				} );

				it( 'inserts block object', () => {
					setData( doc, '<paragraph>foo[<inlineWidget></inlineWidget>]bar</paragraph>' );
					insertHelper( '<blockWidget></blockWidget>' );
					expect( getData( doc ) ).to.equal( '<paragraph>foo</paragraph>[<blockWidget></blockWidget>]<paragraph>bar</paragraph>' );
				} );
			} );
		} );

		describe( 'filtering out', () => {
			beforeEach( () => {
				doc = new Document();
				doc.createRoot();

				dataController = new DataController( doc );

				const schema = doc.schema;

				schema.registerItem( 'paragraph', '$block' );

				// Let's use table as an example of content which needs to be filtered out.
				schema.registerItem( 'table' );
				schema.registerItem( 'td' );
				schema.registerItem( 'disallowedWidget' );

				schema.allow( { name: 'table', inside: '$clipboardHolder' } );
				schema.allow( { name: 'td', inside: '$clipboardHolder' } );
				schema.allow( { name: 'td', inside: 'table' } );
				schema.allow( { name: '$block', inside: 'td' } );
				schema.allow( { name: '$text', inside: 'td' } );

				schema.allow( { name: 'disallowedWidget', inside: '$clipboardHolder' } );
				schema.allow( { name: '$text', inside: 'disallowedWidget' } );
				schema.objects.add( 'disallowedWidget' );
			} );

			it( 'filters out disallowed elements and leaves out the text', () => {
				setData( doc, '<paragraph>f[]oo</paragraph>' );
				insertHelper( '<table><td>xxx</td><td>yyy</td></table>' );
				expect( getData( doc ) ).to.equal( '<paragraph>fxxxyyy[]oo</paragraph>' );
			} );

			it( 'filters out disallowed elements and leaves out the paragraphs', () => {
				setData( doc, '<paragraph>f[]oo</paragraph>' );
				insertHelper( '<table><td><paragraph>xxx</paragraph><paragraph>yyy</paragraph><paragraph>zzz</paragraph></td></table>' );
				expect( getData( doc ) ).to.equal( '<paragraph>fxxx</paragraph><paragraph>yyy</paragraph><paragraph>zzz[]oo</paragraph>' );
			} );

			it( 'filters out disallowed objects', () => {
				setData( doc, '<paragraph>f[]oo</paragraph>' );
				insertHelper( '<disallowedWidget>xxx</disallowedWidget>' );
				expect( getData( doc ) ).to.equal( '<paragraph>f[]oo</paragraph>' );
			} );
		} );
	} );

	// @param {module:engine/model/item~Item|String} content
	function insertHelper( content ) {
		if ( typeof content == 'string' ) {
			content = parse( content, doc.schema, {
				context: [ '$clipboardHolder' ]
			} );
		}

		if ( !( content instanceof DocumentFragment ) ) {
			content = new DocumentFragment( [ content ] );
		}

		insertContent( dataController, content, doc.selection );
	}
} );
