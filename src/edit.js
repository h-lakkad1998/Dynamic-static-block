/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

import Select  from 'react-select';

import apiFetch from '@wordpress/api-fetch';

import { useState, useEffect } from '@wordpress/element';

import { addQueryArgs } from '@wordpress/url';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps, RichText, InspectorControls, MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';

import { ButtonGroup, Button, ResponsiveWrapper } from '@wordpress/components';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {WPElement} Element to render.
 */
export default function Edit( { attributes, setAttributes } ) {
	let block_type = ( 'static' === attributes.block_type || 'dynamic_gb' === attributes.block_type  ) ? attributes.block_type : 'static';
	const ALLOWED_MEDIA_TYPES = [ 'image' ];
	const changeBlockType = ( e ) => {
		setAttributes( { block_type: e.target.dataset.val } );
	};

	const [all_categories, setAllCategories] = useState([]);

	const [selectedCategories, setSelectedCategories] = useState([]);

	useEffect(() => {
        // Fetch categories
        apiFetch({ path: '/wp/v2/categories' })
            .then((result) => {
				setAllCategories( result );
            })
            .catch((error) => {
                console.error('Error fetching categories:', error);
            });
    }, []);

	const [defaultPosts, setAllPosts] = useState([]);
	const queryParams = { posts_per_page: -1 };
	useEffect(() => {
		if( ( 0 < attributes.posts_cat.length   ) && '*' !== attributes.posts_cat[0]?.value ){
			let result = attributes.posts_cat.map(item => item.value).join(',');
			queryParams.categories = result;
		}
		//console.log( addQueryArgs( '/wp/v2/posts', queryParams ) );
        apiFetch({ path: addQueryArgs( '/wp/v2/posts', queryParams )  }).then((result) => {
			setAllPosts( result );
			console.log( result.length );
		}).catch((error) => {
			console.error('Error fetching categories:', error);
		});
    }, [selectedCategories]);

	let options = all_categories.map(item => ({
		value: item.id,
		label: item.name
	}) );
	options = [ { value: '*',label: 'All'}, ...options ]
	
	const addNewPostdata = ( )	=> {
		const posts_data = [ ...attributes.static_posts ];
		posts_data.push( {
			mediaId: '',
			mediaURL: '',
			postText: '',
			postLink: '',
		} );
		setAttributes( { static_posts : posts_data } );
	}; 

	const imageSelected = ( media, index ) => {
		const posts_data = [ ...attributes.static_posts ];
		posts_data[index].mediaId = media.id
		posts_data[index].mediaURL = media.url
		posts_data[index].postText = media.title
		posts_data[index].postLink = media.link
		setAttributes( { static_posts : posts_data } );
	}
	
	const removePost = ( index ) => {
		//console.log( 'removed' );
		const posts_data = [ ...attributes.static_posts ];
		posts_data.splice(index,1);
		setAttributes( { static_posts : posts_data } );
	}

	const categorySelection = ( selected_data, e ) => {
		const notAllData = selected_data.filter(item => item.value !== '*');
		const onlyAllData = selected_data.filter(item => item.value === '*');
		const filteredData = ( 'select-option' === e.action && '*' === e.option.value ) ?  onlyAllData :  notAllData ;
		setAttributes( { posts_cat: filteredData } );
		setSelectedCategories( filteredData );
	}

	
	return (
		<div { ...useBlockProps() }>
			<ButtonGroup className='options' >
				<Button data-val='static' onClick={ changeBlockType } variant='tertiary' isPressed={ 'static' === block_type ? true : false } >{__('Static Block','h-lakkad')}</Button>
				<Button data-val='dynamic_gb' onClick={ changeBlockType } variant='tertiary' isPressed={ 'dynamic_gb' === block_type ? true : false } >{__('Dynamic Block','h-lakkad')}</Button>
			</ButtonGroup>
			{ 'static' === block_type ? (
				<>
					<div className='static-block-option-container'>
						<h4>Static Block Settings</h4>
						<div className='static-posts-listing'>
							{ attributes.static_posts.length >= 1 ?  
								 	attributes.static_posts.map( ( location, index ) => {
									return <div key={index} className='static-post-item'>
										<MediaUploadCheck>
											<MediaUpload
												onSelect={ ( media ) => imageSelected(  media, index ) }
												allowedTypes={ ALLOWED_MEDIA_TYPES }
												render={ ( { open } ) => (
													( attributes.static_posts[index].mediaId === '' || undefined === attributes.static_posts[index].mediaId ) ? 
														<Button variant='secondary' onClick={ open }>{__('Select Image','h-lakkad')}</Button> 
													: 
														''
												) }
											/>
										</MediaUploadCheck>
										{ 
											( '' !== attributes.static_posts[index].mediaURL  && undefined !== attributes.static_posts[index].mediaURL  ) ? 
												<>
													<ResponsiveWrapper >
														<img height={70} width={70} src={attributes.static_posts[index].mediaURL} />
													</ResponsiveWrapper>
												</>
											: 
											''
										}
										<Button variant='primary' onClick={ () => removePost( index ) }>{__('Remove Post','h-lakkad')}</Button> 
									</div>
								} )
							 : <p>{__('No data','h-lakkad')}</p> }
						</div>
						<Button id='statick-blck-add-more-btn' variant='primary' onClick={ () => addNewPostdata() }  >{__('Add more','h-lakkad')}</Button>
					</div>
				</>
			) : (
				<>
					<div className='dynamic-block-option-container'>
						<p>{ __('Dynamic Posts', 'h-lakkad') }</p>
						<Select options={options} isMulti onChange={ categorySelection } value={ attributes.posts_cat } />
					</div>
					<div className='dynamic-posts-container'>
						<ul className='posts-lists'>
						{defaultPosts.map(post => (
							<li> { post.title.rendered } </li>
						))}
						</ul>
					</div>

				</>
			) }
		</div>
	);
}
