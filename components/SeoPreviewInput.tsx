import {useFormValue, type ObjectInputProps} from 'sanity'
import styled from 'styled-components'

type SeoValue = {
  _type?: string
  title?: string
  description?: string
}

type SlugValue = {
  current?: string
}

const Preview = styled.section`
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--card-border-color);
  border-radius: 0.5rem;
  background: var(--card-bg-color);
`

const Label = styled.p`
  margin: 0 0 0.75rem;
  color: var(--card-muted-fg-color);
  font-size: 0.8125rem;
  font-weight: 600;
`

const Site = styled.p`
  margin: 0 0 0.25rem;
  color: var(--card-fg-color);
  font-size: 0.875rem;
`

const Url = styled.p`
  margin: 0 0 0.35rem;
  color: var(--card-muted-fg-color);
  font-size: 0.75rem;
  overflow-wrap: anywhere;
`

const Title = styled.p`
  margin: 0 0 0.35rem;
  color: #8ab4f8;
  font-size: 1.25rem;
  line-height: 1.3;
`

const Description = styled.p`
  margin: 0;
  color: var(--card-muted-fg-color);
  font-size: 0.875rem;
  line-height: 1.5;
`

const Note = styled.p`
  margin: 0.75rem 0 0;
  color: var(--card-muted-fg-color);
  font-size: 0.75rem;
  line-height: 1.4;
`

export function SeoPreviewInput(props: ObjectInputProps<SeoValue>) {
  const articleTitle = useFormValue(['title'])
  const excerpt = useFormValue(['excerpt'])
  const slug = useFormValue(['slug']) as SlugValue | undefined
  const previewTitle = props.value?.title || (typeof articleTitle === 'string' ? articleTitle : '')
  const previewDescription =
    props.value?.description || (typeof excerpt === 'string' ? excerpt : '')
  const previewSlug = slug?.current || 'duong-dan-bai-viet'

  return (
    <>
      {props.renderDefault(props)}
      <Preview aria-label="Xem trước kết quả Google">
        <Label>👀 Xem trước khách có thể thấy trên Google</Label>
        <Site>Trạm Laptop Việt</Site>
        <Url>https://www.tramlaptopviet.vn › tin-tuc › {previewSlug}</Url>
        <Title>{previewTitle || 'Tiêu đề bài sẽ hiện ở đây'}</Title>
        <Description>{previewDescription || 'Dòng giới thiệu bài sẽ hiện ở đây.'}</Description>
        <Note>Google có thể tự thay đổi cách hiển thị tùy nội dung khách tìm kiếm.</Note>
      </Preview>
    </>
  )
}
