/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module engine/model/operation/markeroperation
 */

import Operation from './operation';
import Range from '../range';

/**
 * @extends module:engine/model/operation/operation~Operation
 */
export default class MarkerOperation extends Operation {
	/**
	 * @param {String} name Marker name.
	 * @param {module:engine/model/range~Range} oldRange Marker range before the change.
	 * @param {module:engine/model/range~Range} newRange Marker range after the change.
	 * @param {module:engine/model/markercollection~MarkerCollection} markers Marker collection on which change should be executed.
	 * @param {Number|null} baseVersion Document {@link module:engine/model/document~Document#version} on which operation
	 * @param {Boolean} affectsData Specifies whether the marker operation affects the data produced by the data pipeline
	 * (is persisted in the editor's data).
	 * can be applied or `null` if the operation operates on detached (non-document) tree.
	 */
	constructor( name, oldRange, newRange, markers, baseVersion, affectsData ) {
		super( baseVersion );

		/**
		 * Marker name.
		 *
		 * @readonly
		 * @member {String}
		 */
		this.name = name;

		/**
		 * Marker range before the change.
		 *
		 * @readonly
		 * @member {module:engine/model/range~Range}
		 */
		this.oldRange = oldRange ? Range.createFromRange( oldRange ) : null;

		/**
		 * Marker range after the change.
		 *
		 * @readonly
		 * @member {module:engine/model/range~Range}
		 */
		this.newRange = newRange ? Range.createFromRange( newRange ) : null;

		/**
		 * Specifies whether the marker operation affects the data produced by the data pipeline
		 * (is persisted in the editor's data).
		 *
		 * @readonly
		 * @member {Boolean}
		 */
		this.affectsData = affectsData;

		/**
		 * Marker collection on which change should be executed.
		 *
		 * @private
		 * @member {module:engine/model/markercollection~MarkerCollection}
		 */
		this._markers = markers;
	}

	/**
	 * @inheritDoc
	 */
	get type() {
		return 'marker';
	}

	/**
	 * Creates and returns an operation that has the same parameters as this operation.
	 *
	 * @returns {module:engine/model/operation/markeroperation~MarkerOperation} Clone of this operation.
	 */
	clone() {
		return new MarkerOperation( this.name, this.oldRange, this.newRange, this._markers, this.baseVersion, this.affectsData );
	}

	/**
	 * See {@link module:engine/model/operation/operation~Operation#getReversed `Operation#getReversed()`}.
	 *
	 * @returns {module:engine/model/operation/markeroperation~MarkerOperation}
	 */
	getReversed() {
		return new MarkerOperation( this.name, this.newRange, this.oldRange, this._markers, this.baseVersion + 1, this.affectsData );
	}

	/**
	 * @inheritDoc
	 */
	_execute() {
		const type = this.newRange ? '_set' : '_remove';

		this._markers[ type ]( this.name, this.newRange, true, this.affectsData );
	}

	/**
	 * @inheritDoc
	 */
	toJSON() {
		const json = super.toJSON();

		if ( this.oldRange ) {
			json.oldRange = this.oldRange.toJSON();
		}

		if ( this.newRange ) {
			json.newRange = this.newRange.toJSON();
		}

		delete json._markers;

		return json;
	}

	/**
	 * @inheritDoc
	 */
	static get className() {
		return 'MarkerOperation';
	}

	/**
	 * Creates `MarkerOperation` object from deserialized object, i.e. from parsed JSON string.
	 *
	 * @param {Object} json Deserialized JSON object.
	 * @param {module:engine/model/document~Document} document Document on which this operation will be applied.
	 * @returns {module:engine/model/operation/markeroperation~MarkerOperation}
	 */
	static fromJSON( json, document ) {
		return new MarkerOperation(
			json.name,
			json.oldRange ? Range.fromJSON( json.oldRange, document ) : null,
			json.newRange ? Range.fromJSON( json.newRange, document ) : null,
			document.model.markers,
			json.baseVersion,
			json.affectsData
		);
	}
}
