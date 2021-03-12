import React from "react"
import { Image, Modal, ScrollView, Text, View } from "react-native"
import styled from "styled-components"
import { Url } from "@zigbang/utils"
import * as Zuix from "@zigbang/zuix"

import { ViewDimension } from "../lib/ViewDimension"
import { replaceIcDomain } from "../lib/Domain"
import { ImageViewer } from "../components/detail/ImageViewer"

export class ImageViewerModal extends React.Component<ImageViewerModalProps, ImageViewerModalState> {
	private imageViewer!: ImageViewer
	private thumnails!: ScrollView
	private scrollAnimId: number | undefined = undefined
	private scrollAnimTime: number | undefined = undefined
	private scrollOffset = 0
	constructor(props) {
		super(props)

		const images = this.props.images.map((item) =>
			Url.updateQueryStringParams(replaceIcDomain(item.image)!, { h: 640, a: 1 })
		)

		this.state = {
			visible: false,
			curIndex: this.props.startIndex,
			withQueryImages: images,
			thumbnails: [...images.slice(this.props.startIndex), ...images.slice(0, this.props.startIndex)],
		}
	}
	show() {
		if (!this.props.images || this.props.images.length < 1) return

		const images = this.props.images.map((item) =>
			Url.updateQueryStringParams(replaceIcDomain(item.image)!, { h: 640, a: 1 })
		)

		this.setState({
			visible: true,
			curIndex: this.props.startIndex,
			withQueryImages: images,
			thumbnails: [...images.slice(this.props.startIndex), ...images.slice(0, this.props.startIndex)],
		})
	}
	hide() {
		this.setState({
			visible: false,
		})
	}
	render() {
		if (this.props.images.length < 1) return null

		let imageViewerWidth = ViewDimension.get().width
		let imageViewerHeight = ViewDimension.get().height
		if (!ViewDimension.isMobile) {
			if (ViewDimension.get().width >= ViewDimension.get().height) {
				imageViewerHeight = Math.floor(ViewDimension.get().height * 0.6)
				imageViewerWidth = Math.floor(imageViewerHeight * (IMAGE_WIDTH / IMAGE_HEIGHT))
			} else {
				imageViewerWidth = Math.floor(ViewDimension.get().width * 0.6)
				imageViewerHeight = Math.floor(imageViewerWidth / (IMAGE_WIDTH / IMAGE_HEIGHT))
			}
		}

		return (
			<Modal
				transparent
				visible={this.state.visible}
				animationType="slide"
				onRequestClose={() => {
					this.props.cancelCallback()
				}}>
				<BackgroundView />
				{this.renderHeader()}
				<ContentView width={imageViewerWidth}>
					<View style={{ height: imageViewerHeight, width: imageViewerWidth }}>
						<ImageViewer
							ref={(ref) => {
								if (ref) {
									this.imageViewer = ref
								}
							}}
							startIndex={this.state.curIndex}
							circular
							onSwipeEnd={(index, length) => {
								const orderedImages = [
									...this.state.withQueryImages.slice(index),
									...this.state.withQueryImages.slice(0, index),
								]
								this.setState({
									curIndex: index,
									thumbnails: orderedImages,
								})
							}}
							images={this.state.withQueryImages}
						/>
					</View>
					{this.props.images.length > 1 && this.renderThumbnail(imageViewerWidth, imageViewerHeight)}
				</ContentView>
				{this.props.images.length > 1 && this.renderArrow()}
			</Modal>
		)
	}
	private get statusBarHeight(): number {
		switch (this.props.platform) {
			case "app_ios_x":
				return 44
			case "app_ios":
				return 20
			default:
				return 0
		}
	}
	private renderHeader() {
		if (!this.props.images || this.props.images.length < this.state.curIndex) return null

		const title = `/${this.props.images.length}${
			this.props.images[this.state.curIndex].title ? ` - ${this.props.images[this.state.curIndex].title}` : ""
		}`
		const boldTitle = `${this.state.curIndex + 1}`
		const paddingTop = this.statusBarHeight

		return (
			<Root style={{ paddingTop, paddingHorizontal: 10 }}>
				<Title>
					<Index>{boldTitle}</Index>
					{title}
				</Title>
				<Right>
					<Zuix.Touchable
						onPress={() => {
							this.props.cancelCallback()
						}}>
						<Image
							style={{ width: 30, height: 30 }}
							source={require("@zigbang/screens/static/ic_actionbar_close_30x30_nor_white.png")}
						/>
					</Zuix.Touchable>
				</Right>
			</Root>
		)
	}
	private renderThumbnail(width: number, height: number) {
		if (ViewDimension.isMobile) return null

		const cardWidth = Math.floor((width * THUMBNAIL_WIDTH) / IMAGE_WIDTH)
		const cardHeight = Math.floor((height * THUMBNAIL_HEIGHT) / IMAGE_HEIGHT)
		const margin = Math.floor((width - cardWidth * 7) / 6)
		const borderColor = Zuix.Color.yellow1

		return (
			<ThumbmailView width={width}>
				<Zuix.HideScrollBarScrollView
					innerRef={(ref) => {
						if (ref) this.thumnails = ref
					}}
					horizontal
					scrollEnabled={false}
					showsHorizontalScrollIndicator={false}
					showsVerticalScrollIndicator={false}
					style={{
						marginTop: 10,
					}}
					contentContainerStyle={{
						justifyContent: "center",
						alignItems: "center",
					}}>
					{[...this.state.thumbnails].map((image, index) => (
						<Zuix.Touchable
							style={{ width: cardWidth, height: cardHeight, marginRight: margin }}
							onPress={() => {
								if (this.thumnails && this.scrollAnimId === undefined && index > 0) {
									this.scrollOffset = (cardWidth + margin) * index
									this.setState({
										curIndex: (this.state.curIndex + index) % this.state.withQueryImages.length,
									})
									this.scrollAnimId = requestAnimationFrame(this.scrollAnimation.bind(this))
								}
							}}>
							<Zuix.FastImage
								style={{ width: cardWidth, height: cardHeight, marginRight: margin }}
								source={{ uri: image }}
							/>
							{index === 0 && (
								<View
									style={{
										position: "absolute",
										top: 0,
										right: 0,
										bottom: 0,
										left: 0,
										borderColor,
										borderWidth: 3,
									}}
								/>
							)}
						</Zuix.Touchable>
					))}
				</Zuix.HideScrollBarScrollView>
			</ThumbmailView>
		)
	}
	private renderArrow() {
		if (ViewDimension.isMobile) return null

		const showLeft = true
		const showRight = true

		return (
			<ArrowView pointerEvents="box-none">
				{showLeft && (
					<LeftArrow pointerEvents="auto">
						<Zuix.Touchable
							onPress={() => {
								this.imageViewer?.moveTo("left")
							}}
							style={{ width: 68, height: 90 }}>
							<Zuix.FastImage
								style={{ width: "100%", height: "100%" }}
								source={require("@zigbang/screens/static/ic-btn-arrow-left-68-x-90-nor-white.png")}
							/>
						</Zuix.Touchable>
					</LeftArrow>
				)}
				{showRight && (
					<RightArrow pointerEvents="auto">
						<Zuix.Touchable
							onPress={() => {
								this.imageViewer?.moveTo("right")
							}}
							style={{ width: 68, height: 90 }}>
							<Zuix.FastImage
								style={{ width: "100%", height: "100%" }}
								source={require("@zigbang/screens/static/ic-btn-arrow-right-68-x-90-nor-white.png")}
							/>
						</Zuix.Touchable>
					</RightArrow>
				)}
			</ArrowView>
		)
	}
	private scrollAnimation(time: number): void {
		if (this.scrollAnimTime === undefined) {
			this.scrollAnimTime = time
		}

		const delta = time - this.scrollAnimTime

		if (delta >= 0) {
			let endAnimation = false
			let valDelta = delta

			if (delta > 400) {
				valDelta = 400
				endAnimation = true
			}

			// Loop
			this.thumnails?.scrollTo({ x: (this.scrollOffset * valDelta) / 400, y: 0, animated: false })

			if (endAnimation) {
				if (this.scrollAnimId !== undefined) {
					const orderedImages = [
						...this.state.withQueryImages.slice(this.state.curIndex),
						...this.state.withQueryImages.slice(0, this.state.curIndex),
					]
					this.setState(
						{
							thumbnails: orderedImages,
						},
						() => {
							if (this.thumnails) {
								this.thumnails.scrollTo({ x: 0, y: 0, animated: false })
								cancelAnimationFrame(this.scrollAnimId!)
								this.scrollAnimTime = undefined
								this.scrollAnimId = undefined
							}
						}
					)
				}
			} else {
				this.scrollAnimId = requestAnimationFrame(this.scrollAnimation.bind(this))
			}
		}
	}
}

export interface ImageViewerModalProps {
	cancelCallback: () => void
	startIndex: number
	images: { image: string; title?: string }[]
	platform?: "www" | "m" | "app_android" | "app_ios" | "app_ios_x"
}

export interface ImageViewerModalState {
	visible: boolean
	curIndex: number
	withQueryImages: string[]
	thumbnails: string[]
}

const Root = styled(View)`
	min-height: ${ViewDimension.navigationHeaderHeight}px;
	flex-direction: row;
	align-items: center;
	left: 0;
	right: 0;
	z-index: 500;
	position: absolute;
`

const Title = styled(Text)`
	flex: 1;
	font-family: SpoqaHanSans;
	font-size: 14px;
	text-align: center;
	color: #ffffff;
`

const Index = styled(Text)`
	flex: 1;
	font-family: SpoqaHanSans;
	font-size: 14px;
	font-weight: bold;
	text-align: center;
	color: #ffffff;
`

const Right = styled(View)`
	position: absolute;
	right: 5px;
	padding: ${ViewDimension.statusBarHeight}px 0px 0;
`

const ContentView = styled(View)`
	width: ${(props: { width: number }) => props.width}px;
	margin: auto;
	overflow: hidden;
`

const BackgroundView = styled(View)`
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	background-color: ${() => (ViewDimension.isMobile ? "#000000" : "rgba(0, 0, 0, 0.8)")};
`

const ThumbmailView = styled(View)`
	width: ${(props: { width: number }) => props.width}px;
`

const ArrowView = styled(View)`
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	justify-content: center;
`

const LeftArrow = styled(View)`
	position: absolute;
	width: 68px;
	height: 90px;
	left: 10px;
`

const RightArrow = styled(View)`
	position: absolute;
	width: 68px;
	height: 90px;
	right: 10px;
`

const IMAGE_WIDTH = 960
const IMAGE_HEIGHT = 640
const THUMBNAIL_WIDTH = 132
const THUMBNAIL_HEIGHT = 88
