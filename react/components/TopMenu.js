import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'
import { ExtensionPoint } from 'vtex.render-runtime'
import ResizeDetector from 'react-resize-detector'
import { ButtonWithIcon } from 'vtex.styleguide'
import { IconSearch } from 'vtex.dreamstore-icons'
import { Container } from 'vtex.store-components'

import Logo from './Logo'
import SearchBar from './SearchBar'
import {Spacer, Border} from './Helpers'

import header from '../store-header.css'

const LOGO_MAX_WIDTH_DESKTOP = 150
const LOGO_MAX_WIDTH_MOBILE = 90
const LOGO_MAX_HEIGHT_MOBILE = 40
const LOGO_MAX_HEIGHT_DESKTOP = 75
const LOGO_COLLAPSED_HEIGHT = 40
const ICON_SIZE_MOBILE = 16
const ICON_SIZE_DESKTOP = 30
const ICON_CLASSES_MOBILE = 'c-muted-1 animated zoomIn faster'
const SEARCHBAR_HEIGHT = 40
const EXTRA_HEADERS_HEIGHT = 32
const HEADER_HEIGHT= 64
const MOBILE_SEARCH_SCROLL_LIMIT = 0.1979 

class TopMenu extends Component {
  
  container = React.createRef()
  content = React.createRef()
  logoContainer = React.createRef()
  mobileSearchButton = React.createRef()

  state = {
    mobileSearchActive: false,
    logoHeight: null,
    iconsHeight: null,
    minHeight: null,
    maxHeight: null,
    heightReduction: 0,
    extraHeadersHeight: 0,
  }

  componentDidMount() {
    this.getInitialDimensions()

    const {mobileMode} = this.props
    if(mobileMode) return

    document.addEventListener('scroll', this.handleScroll)
    /** TODO: Use this `handleUpdateDimensions` instead of
     * `getInitialDimensions` when the problem mentioned in
     * the declaration of the latter is fixed.
     * @author lbebber */
    this.handleScroll()
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.handleScroll)
  }

  handleScroll = () => {
    // If it's in leanMode, pretend it's scrolled all the way to the bottom,
    // in order to make it look compressed
    const scroll = this.props.leanMode ? Infinity : window.scrollY

    if (typeof scroll !== 'number') return

    const scrollValue = Math.min(1, scroll / Math.max(this.state.heightReduction, this.state.minHeight))

    this.updateMobileSearch(scrollValue)
    this.updateLogoScroll(scrollValue)
    this.updateTopBarScroll(scrollValue)
  }

  updateMobileSearch = scrollValue => {
    if (scrollValue <= MOBILE_SEARCH_SCROLL_LIMIT && this.state.mobileSearchActive) {
      this.setState({ mobileSearchActive: false })
    }
  }

  updateLogoScroll = scrollValue => {
    const logoElement = this.logoContainer.current
    if (logoElement) {
      const targetScale = Math.min(1, LOGO_COLLAPSED_HEIGHT / this.state.logoHeight)
      const scale = 1 - (scrollValue * (1 - targetScale))
      logoElement.style.transform = `scale(${scale})`
    }
  }

  /**
   * This function, instead of setting the height of the topbar, changes its
   * position and the position of its contents. This is done for performance
   * (changing height triggers a reflow, which is expensive. Setting transform
   * only triggers a composition, which is cheap)
  **/
  updateTopBarScroll = scrollValue => {
    // This division/rounding/multiplication prevents the position from being a non-integer
    // on either elements, so as to not to become blurry on non-retina displays, and makes both
    // move in tandem, preventing "jumpiness"
    const currentHeightReduction = Math.round((scrollValue * this.state.heightReduction) / 2) * 2

    const containerElement = this.container.current
    if (containerElement) {
      const offset = currentHeightReduction
      containerElement.style.transform = `translate3d(0, ${-offset}px, 0)`
    }

    const contentElement = this.content.current
    if (contentElement) {
      const offset = currentHeightReduction * 0.5
      contentElement.style.transform = `translate3d(0, ${offset}px, 0)`
    }
  }

  getContentPaddings = () => {
    // Gets the calculated vertical paddings of the content container
    const contentElement = this.content.current
    const contentComputedStyles = contentElement && window.getComputedStyle && window.getComputedStyle(contentElement, null)
    return contentComputedStyles ? parseFloat(contentComputedStyles.getPropertyValue('padding-top')) * 2 : 0
  }

  handleUpdateIconsDimensions = (width, height) => {
    this.setState({
      iconsHeight: height,
    }, () => {
      this.handleUpdateDimensions()
    })
  }

  handleUpdateLogoDimensions = (width, height) => {
    this.setState({
      logoHeight: height,
    }, () => {
      this.handleUpdateDimensions()
    })
  }

  handleExtraHeadersResize = (width, height) => {
    this.setState({
      extraHeadersHeight: height,
    }, () => {
      this.handleUpdateDimensions()
    })
  }

  handleUpdateDimensions = () => {
    const contentPaddings = this.getContentPaddings()
    const logoReduction = Math.max(0, this.state.logoHeight - Math.max(this.state.iconsHeight, LOGO_COLLAPSED_HEIGHT))
    const heightReduction = Math.max(0, contentPaddings + logoReduction)

    const maxHeight = (this.container.current ? this.container.current.offsetHeight : 0) + this.state.extraHeadersHeight
    const minHeight = maxHeight - heightReduction - (heightReduction % 2)

    this.setState({
      heightReduction,
      maxHeight,
      minHeight,
    }, () => {
      this.saveInitialDimensions()
      this.props.onUpdateDimensions({ minHeight, maxHeight })
    })
  }

  renderLogo = () => {
    const { logoUrl, linkUrl, logoTitle, leanMode } = this.props
    
    const sizeDesktop = { width: LOGO_MAX_WIDTH_DESKTOP, height: LOGO_MAX_HEIGHT_DESKTOP }
    const sizeMobile = { width: LOGO_MAX_WIDTH_MOBILE, height: LOGO_MAX_HEIGHT_MOBILE }

    return (
      <div className="mr5" ref={this.logoContainer}>
        <Logo
          src={logoUrl}
          link={linkUrl}
          title={logoTitle}
          sizeDesktop={leanMode ? sizeMobile : sizeDesktop}
          sizeMobile={sizeMobile}
          onResize={this.handleUpdateLogoDimensions}
        />
      </div>
    )
  }

  renderIcons() {
    const { leanMode, showLogin, showSearchBar } = this.props
    const searchIcon = <IconSearch size={ICON_SIZE_MOBILE} className={ICON_CLASSES_MOBILE} />

    return (
      <div className={`${header.topMenuIcons} flex justify-end flex-grow-1 flex-grow-0-ns items-center order-1-s ml-auto-s order-2-ns`}>
        {/**
          * Both desktop and mobile icons are rendered, and hidden through CSS,
          * for better server side rendering support
         **/}
        <ResizeDetector handleHeight onResize={this.handleUpdateIconsDimensions}>
          
          {/* Mobile icons */}
          <div className="flex dn-ns mr3">
            
            {showSearchBar && !leanMode && (
              <div ref={this.mobileSearchButton} className="pv2 nl5">
                <ButtonWithIcon
                  icon={searchIcon}
                  variation="tertiary"
                  onClick={() => this.setState(state => ({ mobileSearchActive: !state.mobileSearchActive }))}
                />
              </div>
            )}

            {showLogin && (
              <ExtensionPoint
                id="login"
                iconClasses={ICON_CLASSES_MOBILE}
                labelClasses={ICON_CLASSES_MOBILE}
                iconSize={ICON_SIZE_MOBILE}
              />
            )}

            {!leanMode && <ExtensionPoint
              id="minicart"
              iconClasses={ICON_CLASSES_MOBILE}
              labelClasses={ICON_CLASSES_MOBILE}
              iconSize={ICON_SIZE_MOBILE}
            />}

          </div>
          
          {/** Desktop icons */}
          <div className="dn flex-ns">
            {showLogin && (
              <ExtensionPoint
                id="login"
                iconClasses="c-muted-1"
                labelClasses="c-muted-1"
                iconSize={ICON_SIZE_DESKTOP}
                iconLabel={<FormattedMessage id="header.topMenu.login.icon.label" />}
              />
            )}
            {!leanMode && (
              <ExtensionPoint
                id="minicart"
                iconClasses="c-muted-1"
                labelClasses="c-muted-1"
                iconSize={ICON_SIZE_DESKTOP}
                iconLabel={<FormattedMessage id="header.topMenu.minicart.icon.label" />}
              />
            )}
          </div>
        </ResizeDetector>
      </div>
    )
  }

  renderCategoryMenu = (mobileMode) => (
    <ExtensionPoint
        id="category-menu"
        mobileMode={mobileMode}
        iconSize={ICON_SIZE_MOBILE}
        iconClasses={ICON_CLASSES_MOBILE}
    />
  )

  renderFixedContent = () => {
    const { leanMode, mobileMode } = this.props
    const { mobileSearchActive } = this.state

    return mobileSearchActive ? (
      mobileMode && (
        <div className="flex justify-start pa2 relative w-100">
          <SearchBar
            isMobile
            autoFocus
            iconClasses={ICON_CLASSES_MOBILE}
            height={SEARCHBAR_HEIGHT}
            onCancel={() => this.setState({ mobileSearchActive: false })}
          />
        </div>
      )
    ) : (
      <React.Fragment>
        {!leanMode && mobileMode && (
          <div className="db dn-ns">
            {this.renderCategoryMenu(mobileMode)}
          </div>
        )}

        {this.renderLogo()}

        {!leanMode && !mobileMode && (
          <div className="dn db-ns flex-grow-1">
            <SearchBar />
          </div>
        )}

        {this.renderIcons()}
      </React.Fragment>
    )
  }

  renderBorder = (fixed, height) => (
    <div
      className={`${fixed && 'fixed top-0 left-0 w-100'} bb bw1 b--muted-4`}
      style={{
        height: height || 'inherit',
        boxSizing: 'content-box',
      }}
    />
  )

  renderCollapsibleContent = (leanMode, minHeight, maxHeight ) => {
    const height = leanMode ? minHeight : maxHeight
    return(
      <React.Fragment>
        
        <Spacer vertical={height} />

        {!leanMode && (
          <div className="relative z-2 bg-base">
            {this.renderCategoryMenu()}
          </div>
        )}

        {/* This is a border below the collapsible menu. It scrolls out of
        view along with the menu */}
        <Border />
      </React.Fragment>
    )
  }

  /** QUICK FIX - persist the calculated dimensions for the
   * first render to avoid bouncing.
   * Caused by the header unmounting and re-mounting,
   * and/or components being "forgotten" across page loads.
   * TODO: Should be removed if/when that is fixed.
   * @author lbebber */
  getInitialDimensions = () => {
    const hasLocalStorage = window && window.localStorage
    if (!hasLocalStorage) return

    try {
      const headerDimensions = JSON.parse(localStorage.getItem('headerDimensions'))

      this.setState({
        ...headerDimensions
      })
    } catch (error) {
      // Unable to parse JSON. Skipping.
    }
  }

  saveInitialDimensions = () => {
    const hasLocalStorage = window && window.localStorage
    if (!hasLocalStorage) return

    try {
      localStorage.setItem('headerDimensions', JSON.stringify({
        extraHeadersHeight: this.state.extraHeadersHeight,
        minHeight: this.state.minHeight,
        maxHeight: this.state.maxHeight,
        logoHeight: this.state.logoHeight,
        iconsHeight: this.state.iconsHeight,
      }))
    } catch (error) {
      // Unable to save to localStorage. Skipping.
    }
  }

  render() {
    
    const { leanMode, extraHeaders, mobileMode } = this.props
    const { maxHeight, minHeight, extraHeadersHeight } = this.state
    const hasCalculatedMenuHeight = typeof maxHeight === 'number'

    return (
      <ResizeDetector handleWidth onResize={this.handleUpdateDimensions}>
        
        <div className="fixed top-0 left-0 w-100 z-4">
          <ResizeDetector handleHeight onResize={this.handleExtraHeadersResize}>
            {extraHeaders}
          </ResizeDetector>
        </div>

        <Container
          className={`${header.topMenuContainer} flex justify-center w-100 bg-base left-0 z-3 ${hasCalculatedMenuHeight ? 'fixed' : 'relative'}`}
          ref={this.container}
          style={{
            top: extraHeadersHeight,
          }}
        >
          <div
            className={`w-100 mw9 flex justify-center ${leanMode ? 'pv0' : 'pv6-l pv2-m'}`}
            ref={this.content}
            style={{
              /** Prevents the empty margins of this element from blocking the users clicks
               * TODO: create a tachyons class for pointer events and remove this style
               * @author lbebber */
              pointerEvents: 'none',
            }}
          >
            <div
              className="flex w-100 justify-between-m items-center pv3"
              style={{
                pointerEvents: 'auto',
              }}>
              {this.renderFixedContent()}
            </div>
          </div>
        </Container>
        
        <Border fixed top={HEADER_HEIGHT + EXTRA_HEADERS_HEIGHT} />

        {mobileMode && <Spacer vertical={80} />}

        {!mobileMode && this.renderCollapsibleContent(leanMode, minHeight, maxHeight)}
      
      </ResizeDetector>
    )
  }
}

TopMenu.propTypes = {
  linkUrl: PropTypes.string,
  logoUrl: PropTypes.string,
  logoTitle: PropTypes.string,
  showSearchBar: PropTypes.bool,
  showLogin: PropTypes.bool,
  leanMode: PropTypes.bool,
  onUpdateDimensions: PropTypes.func,
  extraHeaders: PropTypes.node,
}

TopMenu.defaultProps = {
  showSearchBar: true,
  showLogin: true,
  onUpdateDimensions: () => { },
}

export default TopMenu
