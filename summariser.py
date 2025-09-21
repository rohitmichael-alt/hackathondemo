from transformers import pipeline

summariser = pipeline("summarization", model="facebook/bart-large-cnn")
title_gen = pipeline("summarization", model="mrm8488/t5-base-finetuned-summarize-news")


def summarise_text(text, max_len=200, min_len=80):
    # Facebook Bart takes 1024 at a time, otherwise doesn't work. Afterwards maybe we change model without this problem
    if len(text) > 1024:   
        text = text[:1024]

    result = summariser(
        text,
        max_length=max_len,
        min_length=min_len,
        do_sample=False
    )[0]["summary_text"]

    return result


def generate_title(text):
    snippet = text[:512]
    result = title_gen(
        snippet,
        max_new_tokens=20,
        min_length=5,
        do_sample=False,
        early_stopping=True,
        clean_up_tokenization_spaces=True
    )
    title = result[0]["summary_text"].strip()

    bad_chars = "([{-–"
    if title and title[-1] in bad_chars:
        title = title[:-1].rstrip()

    if len(title.split()) < 4:
        title = " ".join(text.split()[:10]) + "..."

    return title
from transformers import pipeline

summariser = pipeline("summarization", model="facebook/bart-large-cnn")
title_gen = pipeline("summarization", model="mrm8488/t5-base-finetuned-summarize-news")


def summarise_text(text, max_len=200, min_len=80):
    if len(text) > 1024:   
        text = text[:1024]

    result = summariser(
        text,
        max_length=max_len,
        min_length=min_len,
        do_sample=False
    )[0]["summary_text"]

    return result


def generate_title(text):
    snippet = text[:512]
    result = title_gen(
        snippet,
        max_new_tokens=20,
        min_length=5,
        do_sample=False,
        early_stopping=True,
        clean_up_tokenization_spaces=True
    )
    title = result[0]["summary_text"].strip()

    bad_chars = "([{-–"
    if title and title[-1] in bad_chars:
        title = title[:-1].rstrip()

    if len(title.split()) < 4:
        title = " ".join(text.split()[:10]) + "..."

    return title
